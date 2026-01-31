/**
 * One-time script to create the first admin user.
 * Run from backend: node scripts/seedAdmin.js
 * Requires .env with MONGO_URI and JWT_SECRET.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";  // change this
const ADMIN_NAME = "Admin";
const ADMIN_DEPARTMENT = "IT";

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ username: ADMIN_USERNAME });
  if (existing) {
    console.log(`User "${ADMIN_USERNAME}" already exists. Skipping admin creation.`);
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name: ADMIN_NAME,
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: "admin",
      department: ADMIN_DEPARTMENT,
    });
    console.log(`Created admin user: ${ADMIN_USERNAME}`);
  }

  console.log("Log in at /login and change the password.");
  
  // Always try to seed faculty
  await seedFaculty();
  
  await mongoose.disconnect();
  process.exit(0);
}

async function seedFaculty() {
  console.log("Seeding faculty users...");

  const facultyUsers = [
    { name: "Dr. John Smith", username: "john.smith", password: "faculty123", department: "IT" },
    { name: "Prof. Sarah Johnson", username: "sarah.johnson", password: "faculty123", department: "CSE" },
    { name: "Dr. Michael Brown", username: "michael.brown", password: "faculty123", department: "ECE" },
  ];

  for (const faculty of facultyUsers) {
    const existing = await User.findOne({ username: faculty.username });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(faculty.password, 10);
      await User.create({
        ...faculty,
        password: hashedPassword,
        role: "faculty",
      });
      console.log(`Created faculty: ${faculty.name}`);
    } else {
      console.log(`Faculty ${faculty.name} already exists`);
    }
  }
}

run().then(() => {
  return seedFaculty();
}).catch((err) => {
  console.error("Seed failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
