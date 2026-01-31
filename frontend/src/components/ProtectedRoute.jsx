import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ roles=[] }) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (!token || !userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);

  if (roles.length && !roles.includes(user.role)) {
    return <div className="text-center mt-24">Unauthorized</div>;
  }
  return <Outlet />;
}
