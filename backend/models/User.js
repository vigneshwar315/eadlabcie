import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["admin", "faculty", "student"] },
  department: String,
  semester: Number,
  section: String,
  email: { type: String, default: null },
  admissionYear: { type: Number, default: null }, // e.g., 2022
  graduationYear: { type: Number, default: null }, // e.g., 2026 (auto-calculated: admissionYear + 4)
  status: { type: String, enum: ["active", "passedout"], default: "active" }, // Track if student has graduated
});

export default mongoose.model("User", userSchema);
