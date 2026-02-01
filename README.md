# Lab CIE Portal - Educational Lab Management System

A comprehensive full-stack web application for managing lab assignments, student batches, and marks tracking in educational institutions.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [User Roles & Workflows](#user-roles--workflows)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The **Lab CIE Portal** is designed to streamline the management of continuous internal evaluation (CIE) in laboratory courses. It enables:

- **Admins** to manage users, labs, assignments, and batches
- **Faculty** to enter and track student marks
- **Students** to view their performance and download reports

The system uses role-based access control with JWT authentication to ensure secure operations.

---

## ✨ Features

### Admin Features
- 👥 **User Management** - Add, edit, bulk import, and delete users (students, faculty, admin)
- 🧪 **Lab Management** - Add, edit, bulk import labs with semester and department mapping
- 📊 **Lab Assignment** - Assign labs to sections and semesters
- 👥 **Batch Management** - Auto-divide students into 2-3 batches with faculty assignment
- 📅 **Recurring Dates** - Auto-generate session dates based on day-of-week
- 📈 **Semester Management** - Increment semester for all active students
- 🔍 **View Batches** - Monitor all lab batch assignments and student groupings

### Faculty Features
- 📋 **View Assigned Batches** - See all assigned lab-section-batch combinations
- ✏️ **Enter Marks** - Record weekly marks (Pr, PE, P, R, C, T components)
- 📊 **Mark History** - Track all marks entered for each batch
- 👤 **Student List** - View students in assigned batches

### Student Features
- 📖 **View Lab Marks** - See all marks grouped by lab with faculty details
- 📈 **Performance Tracking** - View session history and average marks
- 🖨️ **Download Reports** - Print marks report for record-keeping

### Core Capabilities
- 🔐 **JWT Authentication** - 7-day token expiry with secure login
- 🎭 **Role-Based Access Control** - Protected routes and endpoints
- 📄 **CSV Bulk Import** - Import users and labs from CSV files
- 🔄 **Data Validation** - Prevent duplicates and invalid data
- 📱 **Responsive Design** - Tailwind CSS responsive UI
- 🎨 **Modern UI** - Clean, intuitive interface with Tailwind CSS

---

## 🛠 Tech Stack

### Frontend
- **React 19** - UI framework
- **React Router 7** - Client-side routing
- **Vite** - Build tool (lightning-fast development)
- **Tailwind CSS 4** - Utility-first CSS framework
- **Axios** - HTTP client
- **Day.js** - Date manipulation
- **react-to-print** - Report generation

### Backend
- **Node.js** - Runtime environment
- **Express.js 5** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose 8** - ODM for MongoDB
- **bcryptjs** - Password hashing
- **JSON Web Tokens (JWT)** - Authentication
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Environment variables

---

## 📁 Project Structure
eadlabcie/
├── backend/
│ ├── .env # Environment variables
│ ├── .gitignore
│ ├── package.json
│ ├── server.js # Express server entry point
│ ├── facultynames.csv # Sample faculty data
│ ├── labnames.csv # Sample lab data
│ ├── studentnames_fixed.csv # Sample student data
│ ├── config/
│ │ └── db.js # MongoDB connection
│ ├── controllers/
│ │ ├── adminController.js # Admin business logic
│ │ ├── authController.js # Authentication logic
│ │ ├── facultyController.js # Faculty operations
│ │ └── studentController.js # Student operations
│ ├── middleware/
│ │ └── authMiddleware.js # JWT verification & role checks
│ ├── models/
│ │ ├── User.js # User schema (admin, faculty, student)
│ │ ├── Lab.js # Lab schema
│ │ ├── LabAssignment.js # Lab-Section assignment
│ │ ├── LabBatch.js # Batch with faculty & students
│ │ └── Marks.js # Student marks per batch
│ ├── routes/
│ │ ├── adminRoutes.js
│ │ ├── authRoutes.js
│ │ ├── facultyRoutes.js
│ │ └── studentRoutes.js
│ └── scripts/
│ └── seedAdmin.js # Create first admin user
│
├── frontend/
│ ├── .env # Frontend environment variables
│ ├── .gitignore
│ ├── package.json
│ ├── vite.config.js # Vite configuration
│ ├── tailwind.config.js # Tailwind CSS config
│ ├── eslint.config.js
│ ├── index.html
│ ├── src/
│ │ ├── main.jsx # React entry point
│ │ ├── App.jsx # Main App component
│ │ ├── App.css
│ │ ├── index.css
│ │ ├── api/
│ │ │ └── api.js # Axios instance with JWT injection
│ │ ├── components/
│ │ │ ├── NavBar.jsx # Navigation bar with logout
│ │ │ └── ProtectedRoute.jsx # Role-based route protection
│ │ ├── pages/
│ │ │ ├── Login.jsx # Authentication page
│ │ │ ├── AdminAssignLab.jsx # Admin dashboard (all 5 tabs)
│ │ │ ├── FacultyEnterMarks.jsx # Faculty marks entry
│ │ │ └── StudentDashboard.jsx # Student marks view
│ │ └── utils/
│ │ ├── csvParse.js # CSV parsing utility
│ │ └── helpers.js # Helper functions
│ └── public/ # Static assets
│
└── IMPORT_AND_SETUP.md # Setup guide with sample data
