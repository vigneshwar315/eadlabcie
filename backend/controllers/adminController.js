import User from "../models/User.js";
import Lab from "../models/Lab.js";
import LabAssignment from "../models/LabAssignment.js";
import LabBatch from "../models/LabBatch.js";
import bcrypt from "bcryptjs";

const generateDates = (startDate, endDate, dayOfWeek) => {
  const dayIndex = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ].indexOf(dayOfWeek);
  if (dayIndex === -1) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  let current = new Date(start);
  const dates = [];

  while (current <= end) {
    if (current.getDay() === dayIndex) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export const addUser = async (req, res) => {
  try {
    const { name, username, password, role, department, semester, section, admissionYear, graduationYear, email } =
      req.body;

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      username,
      password: hash,
      role,
      department,
      semester,
      section,
      email: email || null,
      admissionYear: admissionYear ? Number(admissionYear) : null,
      graduationYear: graduationYear ? Number(graduationYear) : null,
      status: role === "student" ? "active" : undefined,
    });

    res.status(201).json({
      message: `${role} added successfully`,
      user: newUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, password, role, department, semester, section, admissionYear, graduationYear, email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    user.name = name || user.name;
    user.role = role || user.role;
    user.department = department || user.department;
    user.email = email !== undefined ? email : user.email;
    
    if (role === "student" || user.role === "student") {
      user.semester = semester !== undefined ? semester : user.semester;
      user.section = section || user.section;
      user.admissionYear = admissionYear ? Number(admissionYear) : user.admissionYear;
      user.graduationYear = graduationYear ? Number(graduationYear) : user.graduationYear;
    }

    // Only hash password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: user.toObject(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const addLab = async (req, res) => {
  try {
    const { labCode, labName, semester, department } = req.body;
    const newLab = await Lab.create({
      labCode,
      labName,
      semester,
      department,
    });
    res.status(201).json({
      message: "Lab added successfully",
      lab: newLab,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateLab = async (req, res) => {
  try {
    const { labId } = req.params;
    const { labCode, labName, semester, department } = req.body;

    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({ message: "Lab not found" });
    }

    lab.labCode = labCode || lab.labCode;
    lab.labName = labName || lab.labName;
    lab.semester = semester !== undefined ? semester : lab.semester;
    lab.department = department || lab.department;

    await lab.save();

    res.status(200).json({
      message: "Lab updated successfully",
      lab: lab,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/** Create LabAssignment only (no faculty/batch). Step 1 of assign flow. */
export const assignLab = async (req, res) => {
  try {
    const {
      labId,
      semester,
      section,
      academicYear,
      semesterType,
    } = req.body;

    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({ message: "Invalid lab" });
    }

    // Validate semester
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ message: "Semester must be between 1 and 8" });
    }

    // Fetch cohort years from first student in this semester/section
    const student = await User.findOne(
      {
        role: "student",
        semester,
        section,
      },
      { admissionYear: 1, graduationYear: 1 }
    );

    const cohortYears = student
      ? `${student.admissionYear}-${student.graduationYear}`
      : "N/A";

    const assignment = await LabAssignment.create({
      labId,
      semester,
      section,
      cohortYears,
      academicYear,
      semesterType,
    });

    const populated = await LabAssignment.findById(assignment._id).populate(
      "labId"
    );

    res.status(201).json({
      message: "Lab assignment created. Now generate batches.",
      assignment: populated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/** Step 2: Create LabBatches, divide students, assign faculty. */
export const generateBatches = async (req, res) => {
  try {
    const { labAssignmentId, numberOfBatches, batches } = req.body;

    if (![2, 3].includes(Number(numberOfBatches)) || !Array.isArray(batches)) {
      return res
        .status(400)
        .json({ message: "numberOfBatches must be 2 or 3; batches must be array" });
    }

    if (batches.length !== numberOfBatches) {
      return res
        .status(400)
        .json({ message: "batches length must match numberOfBatches" });
    }

    const assignment = await LabAssignment.findById(labAssignmentId).populate(
      "labId"
    );
    if (!assignment) {
      return res.status(404).json({ message: "Lab assignment not found" });
    }

    const semester = assignment.semester;  // ← Use stored semester from assignment
    const section = assignment.section;

    // Get students for manual assignment later
    const students = await User.find({
      role: "student",
      semester,
      section,
    })
      .sort({ username: 1 })
      .lean();

    const validNames = ["B1", "B2", "B3"];
    const seen = new Set();
    const batchDetails = [];
    for (const b of batches) {
      if (!validNames.includes(b.batchName) || seen.has(b.batchName)) {
        return res.status(400).json({
          message: `Invalid or duplicate batchName. Use B1, B2, B3 uniquely.`,
        });
      }
      seen.add(b.batchName);
      const fac = await User.findOne({
        _id: b.facultyId,
        role: "faculty",
      });
      if (!fac) {
        return res.status(400).json({
          message: `Faculty not found for batch ${b.batchName}`,
        });
      }
      const generatedDates = generateDates(b.startDate, b.endDate, b.dayOfWeek);
      batchDetails.push({
        batchName: b.batchName,
        facultyId: b.facultyId,
        startDate: b.startDate,
        endDate: b.endDate,
        dayOfWeek: b.dayOfWeek,
        generatedDates,
      });
    }

    const created = [];

    for (let i = 0; i < numberOfBatches; i++) {
      const lb = await LabBatch.create({
        labAssignmentId,
        batchName: batchDetails[i].batchName,
        facultyId: batchDetails[i].facultyId,
        students: [], // Start with empty students for manual assignment
        startDate: batchDetails[i].startDate,
        endDate: batchDetails[i].endDate,
        dayOfWeek: batchDetails[i].dayOfWeek,
        generatedDates: batchDetails[i].generatedDates,
      });

      created.push(
        await LabBatch.findById(lb._id)
          .populate("facultyId", "name username")
          .lean()
      );
    }


    res.status(201).json({
      message: "Batches generated successfully. Now assign students manually.",
      batches: created,
      students: students.map(s => ({ _id: s._id, name: s.name, username: s.username })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const incrementSemester = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Step 1: Mark as passedout those who completed semester 8
    const graduateResult = await User.updateMany(
      {
        role: "student",
        status: "active",
        semester: 8
      },
      {
        $set: { status: "passedout" }
      }
    );

    // Step 2: Increment semester (only active students below sem 8)
    const incrementResult = await User.updateMany(
      {
        role: "student",
        status: "active",
        semester: { $lt: 8 }
      },
      {
        $inc: { semester: 1 }
      }
    );

    res.json({
      message: "Semester increment completed successfully",
      incrementedCount: incrementResult.modifiedCount,
      graduatedCount: graduateResult.modifiedCount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getLabs = async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = semester ? { semester: Number(semester) } : {};
    const labs = await Lab.find(filter);
    res.json({ labs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getLabAssignments = async (req, res) => {
  try {
    const assignments = await LabAssignment.find()
      .populate("labId")
      .lean();

    const batches = await LabBatch.find({
      labAssignmentId: { $in: assignments.map((a) => a._id) },
    })
      .populate("facultyId", "name username")
      .lean();

    const byAssignment = {};
    for (const b of batches) {
      const aid = String(b.labAssignmentId);
      if (!byAssignment[aid]) byAssignment[aid] = [];
      byAssignment[aid].push({
        _id: b._id,
        batchName: b.batchName,
        facultyId: b.facultyId,
        studentCount: (b.students || []).length,
      });
    }

    // Fetch cohort years for each assignment
    const result = assignments.map((a) => ({
      ...a,
      batches: byAssignment[String(a._id)] || [],
    }));

    res.json({ assignments: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getBatchesForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const batches = await LabBatch.find({ labAssignmentId: assignmentId })
      .populate("facultyId", "name username")
      .populate("students", "name username");
    res.json({ batches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const bulkImportUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ message: "Request body must contain a non-empty users array." });
    }

    // Filter out duplicates and existing users
    const existingUsernames = new Set();
    const existingUsers = await User.find(
      { username: { $in: users.map((u) => u.username) } },
      { username: 1 }
    );
    existingUsers.forEach((u) => existingUsernames.add(u.username));

    const newUsers = [];
    const duplicateUsernames = [];

    users.forEach((user) => {
      if (existingUsernames.has(user.username)) {
        duplicateUsernames.push(user.username);
      } else {
        newUsers.push(user);
      }
    });

    if (newUsers.length === 0) {
      return res.status(400).json({
        message: `All ${users.length} users already exist in the system.`,
        skipped: duplicateUsernames,
      });
    }

    // Hash passwords for new users
    const hashedUsers = await Promise.all(
      newUsers.map(async (user) => {
        const admissionYear = user.admissionYear ? Number(user.admissionYear) : null;
        const graduationYear = user.graduationYear ? Number(user.graduationYear) : null;
        const email = user.email || null;
        
        return {
          ...user,
          password: await bcrypt.hash(user.password || "password", 10),
          email,
          admissionYear,
          graduationYear,
          status: user.role === "student" ? "active" : undefined,
        };
      })
    );

    await User.insertMany(hashedUsers);

    const successCount = hashedUsers.length;
    const message =
      duplicateUsernames.length > 0
        ? `${successCount} users imported successfully. ${duplicateUsernames.length} users were skipped (already exist): ${duplicateUsernames.join(", ")}`
        : `${successCount} users imported successfully!`;

    res.json({
      message,
      imported: successCount,
      skipped: duplicateUsernames.length,
      skippedUsernames: duplicateUsernames,
    });
  } catch (err) {
    console.error("Bulk import error:", err);
    res.status(500).json({
      message: "Bulk import failed. Please check your CSV format and try again.",
      error: err.message,
    });
  }
};

export const bulkImportLabs = async (req, res) => {
  try {
    const { labs } = req.body;
    const createdLabs = await Lab.insertMany(labs);
    res.status(201).json({
      message: `${createdLabs.length} labs imported successfully`,
      labs: createdLabs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const deleteLab = async (req, res) => {
  try {
    const { labId } = req.params;

    const lab = await Lab.findByIdAndDelete(labId);
    if (!lab) {
      return res.status(404).json({ message: "Lab not found" });
    }

    res.json({ message: "Lab deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateBatchStudents = async (req, res) => {
  try {
    const { labBatchId } = req.params;
    const { studentIds } = req.body;

    if (!labBatchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    const batch = await LabBatch.findByIdAndUpdate(
      labBatchId,
      { students: studentIds },
      { new: true }
    ).populate("facultyId", "name username");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.status(200).json({ message: "Students assigned successfully", batch });
  } catch (error) {
    console.error("Error updating batch students:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await LabAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Lab assignment not found" });
    }

    // Delete all batches associated with this assignment
    await LabBatch.deleteMany({ labAssignmentId: assignmentId });

    // Delete the assignment itself
    await LabAssignment.findByIdAndDelete(assignmentId);

    res.json({ message: "Lab assignment and associated batches deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};