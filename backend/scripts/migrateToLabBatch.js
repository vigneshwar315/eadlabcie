/**
 * Migration: Old LabAssignment (facultyId, batch) + Marks (labAssignmentId)
 *          → LabBatch per assignment + Marks use labBatchId.
 *
 * Run once when moving to scalable design. Uses MONGO_URI from .env.
 * - Creates LabBatch for each existing LabAssignment that has facultyId.
 * - Students derived from User (semester, section, batch if present).
 * - Updates Marks to set labBatchId; keeps labAssignmentId for reference.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import LabAssignment from "../models/LabAssignment.js";
import LabBatch from "../models/LabBatch.js";
import Marks from "../models/Marks.js";

dotenv.config();

function generateDates(startDate, endDate, dayOfWeek) {
  const dayIndex = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ].indexOf(dayOfWeek);
  let current = new Date(startDate);
  const dates = [];
  while (current <= new Date(endDate)) {
    if (current.getDay() === dayIndex) dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function batchMap(b) {
  if (!b || b === "All") return "B1";
  if (b === "Batch-1") return "B1";
  if (b === "Batch-2") return "B2";
  return "B1";
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const legacy = await LabAssignment.find({ facultyId: { $exists: true, $ne: null } })
    .populate("labId")
    .lean();

  if (legacy.length === 0) {
    console.log("No legacy LabAssignments with facultyId found. Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  for (const a of legacy) {
    const semester = a.labId?.semester;
    const section = a.section;
    const batchVal = a.batch || "All";

    let students = await User.find({
      role: "student",
      semester,
      section,
    })
      .sort({ username: 1 })
      .lean();

    if (batchVal !== "All") {
      students = students.filter((s) => (s.batch || "") === batchVal);
    }

    const studentIds = students.map((s) => s._id);

    const labBatch = await LabBatch.create({
      labAssignmentId: a._id,
      batchName: batchMap(batchVal),
      facultyId: a.facultyId,
      students: studentIds,
    });

    const up = await Marks.updateMany(
      { labAssignmentId: a._id },
      { $set: { labBatchId: labBatch._id } }
    );

    console.log(
      `Migrated assignment ${a._id} → LabBatch ${labBatch._id}, ${studentIds.length} students, ${up.modifiedCount} marks updated`
    );
  }

  console.log("Migration complete.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
