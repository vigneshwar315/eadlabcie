import mongoose from "mongoose";

const marksSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    labBatchId: { type: mongoose.Schema.Types.ObjectId, ref: "LabBatch" },
    labAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabAssignment",
    },
    weeklyMarks: [
      {
        date: Date,
        marks: { type: Number, default: null },
        Pr: { type: Number, default: null },
        PE: { type: Number, default: null },
        P: { type: Number, default: null },
        R: { type: Number, default: null },
        C: { type: Number, default: null },
        T: { type: Number, default: null },
      },
    ],
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Marks", marksSchema);
