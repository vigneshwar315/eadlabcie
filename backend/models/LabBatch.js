import mongoose from "mongoose";

const labBatchSchema = new mongoose.Schema({
  labAssignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LabAssignment",
    required: true,
  },
  batchName: {
    type: String,
    enum: ["B1", "B2", "B3"],
    required: true,
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  dayOfWeek: { type: String, required: true },
  generatedDates: { type: [Date], default: [] },
});

export default mongoose.model("LabBatch", labBatchSchema);
