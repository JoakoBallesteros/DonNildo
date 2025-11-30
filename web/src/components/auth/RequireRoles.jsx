// src/components/auth/RequireRoles.jsx
import { Navigate, useLocation } from "react-router-dom";

export default function RequireRoles({ allowed, children }) {
  const location = useLocation();
  const role = (localStorage.getItem("dn_role") || "").toUpperCase();

  if (!allowed.includes(role)) {
    // Si no tiene rol permitido → lo mando al inicio
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}