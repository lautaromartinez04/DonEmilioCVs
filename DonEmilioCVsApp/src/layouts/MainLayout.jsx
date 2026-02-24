// src/layouts/MainLayout.jsx
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";
import { useWebSocket } from "../context/WebSocketContext";
import Swal from "sweetalert2";


const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export default function MainLayout() {
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type === "POSTULACION_CREATED") {
      Toast.fire({
        icon: "info",
        title: "Nueva postulación recibida"
      });
    }
  }, [lastMessage]);

  return (
    <div className="flex h-screen bg-gray-950 font-sans overflow-hidden text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}