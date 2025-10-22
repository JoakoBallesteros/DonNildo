// src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token =
    localStorage.getItem("dn_token") || sessionStorage.getItem("dn_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}