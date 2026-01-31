import mongoose from "mongoose";

const labAssignmentSchema = new mongoose.Schema({
  labId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lab",
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  section: {
    type: String,
    required: true,
  },
  cohortYears: {
    type: String,
    default: null,
  },
  academicYear: {
    type: String,
    required: true,
  },
  semesterType: {
    type: String,
    enum: ["Odd", "Even"],
    required: true,
  },
});

export default mongoose.model("LabAssignment", labAssignmentSchema);
