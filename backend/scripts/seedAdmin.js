/**
 * One-time script to create the first admin user.
 * Run from backend: node scripts/seedAdmin.js
 * Requires .env with MONGO_URI, JWT_SECRET, and ADMIN_PASSWORD.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "@gangadhar_it"; // fallback, but change it
const ADMIN_NAME = "Admin";
const ADMIN_DEPARTMENT = "IT";

/**
 * Optional faculty seeding
 * Safe stub so the script never crashes
 */
async function seedFaculty() {
  console.log("Faculty seeding skipped (not implemented).");
}

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ username: ADMIN_USERNAME });

    if (existing) {
      console.log(`ℹ️ User "${ADMIN_USERNAME}" already exists. Skipping admin creation.`);
    } else {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

      await User.create({
        name: ADMIN_NAME,
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: "admin",
        department: ADMIN_DEPARTMENT,
      });

      console.log(`✅ Created admin user: ${ADMIN_USERNAME}`);
      console.log("👉 Log in at /login and change the password immediately.");
    }

    // Always try to seed faculty (safe no-op for now)
    await seedFaculty();

  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

run();
