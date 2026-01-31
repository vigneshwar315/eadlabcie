import LabAssignment from "../models/LabAssignment.js";
import LabBatch from "../models/LabBatch.js";
import Marks from "../models/Marks.js";
import User from "../models/User.js";

/** Batches assigned to this faculty (lab + section + batchName). */
export const getAssignedBatches = async (req, res) => {
  try {
    const batches = await LabBatch.find({ facultyId: req.user._id })
      .populate({
        path: "labAssignmentId",
        populate: { path: "labId" },
      })
      .lean();

    const list = batches.map((b) => {
      const a = b.labAssignmentId;
      const lab = a?.labId;

      return {
        _id: b._id,
        batchName: b.batchName,
        labAssignmentId: b.labAssignmentId?._id,
        labId: lab?._id,
        labName: lab?.labName,
        labCode: lab?.labCode,
        semester: a?.semester,
        section: a?.section,
        cohortYears: a?.cohortYears || "N/A",
        generatedDates: b.generatedDates || [],
      };
    });

    res.json({ batches: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/** Students in a batch. Faculty must own the batch. */
export const getStudentsByBatch = async (req, res) => {
  try {
    const { labBatchId } = req.params;

    const batch = await LabBatch.findById(labBatchId)
      .populate("labAssignmentId")
      .populate("students", "name username");
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
    if (String(batch.facultyId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not assigned to this batch" });
    }

    res.json({ students: batch.students || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/** Enter marks for a batch. Uses labBatchId. */
export const enterMarks = async (req, res) => {
  try {
    const { labBatchId, date, marks } = req.body;
    const entryDate = new Date(date);

    const batch = await LabBatch.findById(labBatchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
    if (String(batch.facultyId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not assigned to this batch" });
    }

    for (const mark of marks) {
      const { studentId, Pr, PE, P, R, C, T } = mark;

      const calculatedTotal =
        (Pr != null ? Number(Pr) : 0) +
        (PE != null ? Number(PE) : 0) +
        (P != null ? Number(P) : 0) +
        (R != null ? Number(R) : 0) +
        (C != null ? Number(C) : 0);
      const finalTotal = T != null ? Number(T) : calculatedTotal;

      const weekData = {
        date: entryDate,
        Pr: Pr != null ? Number(Pr) : null,
        PE: PE != null ? Number(PE) : null,
        P: P != null ? Number(P) : null,
        R: R != null ? Number(R) : null,
        C: C != null ? Number(C) : null,
        T: finalTotal,
        marks: finalTotal,
      };

      let record = await Marks.findOne({ studentId, labBatchId });

      if (!record) {
        record = new Marks({
          studentId,
          labBatchId,
          weeklyMarks: [weekData],
          enteredBy: req.user._id,
        });
        await record.save();
      } else {
        const existingWeek = record.weeklyMarks.find(
          (w) =>
            w.date.toISOString().slice(0, 10) ===
            entryDate.toISOString().slice(0, 10)
        );
        if (existingWeek) {
          existingWeek.Pr = weekData.Pr;
          existingWeek.PE = weekData.PE;
          existingWeek.P = weekData.P;
          existingWeek.R = weekData.R;
          existingWeek.C = weekData.C;
          existingWeek.T = weekData.T;
          existingWeek.marks = weekData.marks;
        } else {
          record.weeklyMarks.push(weekData);
        }
        await record.save();
      }
    }

    res.status(200).json({ message: "Marks updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/** Marks history for a batch. Faculty must own the batch. */
export const getMarksHistory = async (req, res) => {
  try {
    const { labBatchId } = req.params;

    const batch = await LabBatch.findById(labBatchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
    if (String(batch.facultyId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not assigned to this batch" });
    }

    const marksDocs = await Marks.find({ labBatchId })
      .populate("studentId", "name username")
      .lean();

    const flattened = [];
    marksDocs.forEach((doc) => {
      (doc.weeklyMarks || []).forEach((week) => {
        flattened.push({
          studentId: doc.studentId?._id,
          student: {
            name: doc.studentId?.name,
            username: doc.studentId?.username,
          },
          date: week.date,
          marks: week.marks ?? week.T,
          Pr: week.Pr != null ? week.Pr : null,
          PE: week.PE != null ? week.PE : null,
          P: week.P != null ? week.P : null,
          R: week.R != null ? week.R : null,
          C: week.C != null ? week.C : null,
          T: week.T != null ? week.T : week.marks ?? null,
        });
      });
    });

    flattened.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ marks: flattened });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
