import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthed, initialized } = useAuth();

  if (!initialized) {
    // podés devolver un loader; acá dejo un placeholder mínimo
    return null; // o <div className="vh-100 d-flex align-items-center justify-content-center">Cargando…</div>
  }

  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Outlet />;
}
