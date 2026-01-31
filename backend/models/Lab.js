import mongoose from "mongoose";

const labSchema = new mongoose.Schema({
  labCode: String,
  labName: String,
  semester: Number,
  department: String
});

export default mongoose.model("Lab", labSchema);
