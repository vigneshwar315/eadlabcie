import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./pages/Login";
import AdminAssignLab from "./pages/AdminAssignLab";
import FacultyEnterMarks from "./pages/FacultyEnterMarks";
import StudentDashboard from "./pages/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import NavBar from "./components/NavBar";

export default function App(){
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/assign-lab" element={<AdminAssignLab />} />
          </Route>

          <Route element={<ProtectedRoute roles={['faculty']} />}>
            <Route path="/faculty/enter-marks" element={<FacultyEnterMarks />} />
          </Route>

          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
          </Route>

          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-8">Page not found</p>
                <Link to="/" className="btn btn-primary">Go Home</Link>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}
