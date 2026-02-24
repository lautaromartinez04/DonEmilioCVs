// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import MainLayout from "./layouts/MainLayout";
import Dashboard from "./Routes/Dashboard";
import Postulaciones from "./Routes/Postulaciones";
import PostulacionView from "./Routes/PostulacionView";
import Unidades from "./Routes/Unidades";
import Puestos from "./Routes/Puestos";
import Usuarios from "./Routes/Usuarios";
import Login from "./Routes/Login";


// (si ya tenés otras pages, importalas aquí)

import { WebSocketProvider } from "./context/WebSocketContext";

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <BrowserRouter basename="/admin">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/postulaciones" element={<Postulaciones />} />
                <Route path="/postulaciones/:id" element={<PostulacionView />} />
                <Route path="/unidades" element={<Unidades />} />
                <Route path="/puestos" element={<Puestos />} />
                <Route path="/usuarios" element={<Usuarios />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  );
}
