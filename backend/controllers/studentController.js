import Marks from "../models/Marks.js";
import LabBatch from "../models/LabBatch.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

/** Get student marks grouped by lab. Uses labBatchId; faculty from batch. */
export const getStudentMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ studentId: req.user._id })
      .populate({
        path: "labBatchId",
        populate: [
          { path: "labAssignmentId", populate: { path: "labId" } },
          { path: "facultyId", select: "name" },
        ],
      })
      .populate("enteredBy", "name")
      .lean();

    const groupedMarks = {};

    marks.forEach((mark) => {
      const batch = mark?.labBatchId;
      const assignment = batch?.labAssignmentId;
      const lab = assignment?.labId;
      if (!batch || !assignment || !lab) return;

      const labId = String(lab._id);
      const labName = lab.labName || "Unknown Lab";
      const facultyName = batch.facultyId?.name || "TBD";
      const dayOfWeek = assignment.dayOfWeek || "TBD";

      if (!groupedMarks[labId]) {
        groupedMarks[labId] = {
          labId,
          labName,
          faculty: facultyName,
          dayOfWeek,
          sessions: [],
        };
      }

      const weekly = Array.isArray(mark.weeklyMarks) ? mark.weeklyMarks : [];
      weekly.forEach((w) => {
        const t = w.T != null ? w.T : w.marks;
        groupedMarks[labId].sessions.push({
          date: w.date,
          Pr: w.Pr != null ? w.Pr : null,
          PE: w.PE != null ? w.PE : null,
          P: w.P != null ? w.P : null,
          R: w.R != null ? w.R : null,
          C: w.C != null ? w.C : null,
          T: t,
          marks: t,
          enteredBy: mark.enteredBy?.name || "Unknown",
        });
      });
    });

    Object.values(groupedMarks).forEach((lab) => {
      lab.sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate average marks for each column
      const avgMarks = {
        Pr: [],
        PE: [],
        P: [],
        R: [],
        C: [],
        T: [],
      };

      lab.sessions.forEach((session) => {
        if (session.Pr != null) avgMarks.Pr.push(session.Pr);
        if (session.PE != null) avgMarks.PE.push(session.PE);
        if (session.P != null) avgMarks.P.push(session.P);
        if (session.R != null) avgMarks.R.push(session.R);
        if (session.C != null) avgMarks.C.push(session.C);
        if (session.T != null) avgMarks.T.push(session.T);
      });

      lab.averageMarks = {
        Pr:
          avgMarks.Pr.length > 0
            ? (avgMarks.Pr.reduce((a, b) => a + b, 0) / avgMarks.Pr.length).toFixed(2)
            : "N/A",
        PE:
          avgMarks.PE.length > 0
            ? (avgMarks.PE.reduce((a, b) => a + b, 0) / avgMarks.PE.length).toFixed(2)
            : "N/A",
        P:
          avgMarks.P.length > 0
            ? (avgMarks.P.reduce((a, b) => a + b, 0) / avgMarks.P.length).toFixed(2)
            : "N/A",
        R:
          avgMarks.R.length > 0
            ? (avgMarks.R.reduce((a, b) => a + b, 0) / avgMarks.R.length).toFixed(2)
            : "N/A",
        C:
          avgMarks.C.length > 0
            ? (avgMarks.C.reduce((a, b) => a + b, 0) / avgMarks.C.length).toFixed(2)
            : "N/A",
        T:
          avgMarks.T.length > 0
            ? (avgMarks.T.reduce((a, b) => a + b, 0) / avgMarks.T.length).toFixed(2)
            : "N/A",
      };
    });

    res.json({ labs: Object.values(groupedMarks) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("-password");
    res.json({ student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValid = user.password.startsWith("$2b$")
      ? await bcrypt.compare(currentPassword, user.password)
      : currentPassword === user.password;

    if (!isValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
