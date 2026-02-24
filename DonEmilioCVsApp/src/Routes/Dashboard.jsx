// src/Routes/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import { useWebSocket } from "../context/WebSocketContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/postulaciones/counts", { signal: ctrl.signal });
        if (cancelled) return;                      // no tocar estado si ya se desmontó
        setCounts(res || null);
        setError("");
      } catch (err) {
        // Ignorar aborts del fetch (StrictMode/unmount)
        if (err?.name === "AbortError") return;
        console.error("Error al cargar counts:", err);
        if (cancelled) return;
        setError("No se pudieron obtener los datos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort(); // esto dispara el AbortError que ahora ignoramos
    };
  }, []);

  const { lastMessage } = useWebSocket();
  useEffect(() => {
    if (lastMessage && ["POSTULACION_CREATED", "POSTULACION_UPDATED", "POSTULACION_DELETED"].includes(lastMessage.type)) {
      // Reload simple
      (async () => {
        try {
          const res = await apiFetch("/postulaciones/counts");
          setCounts(res || null);
        } catch { /* ignore */ }
      })();
    }
  }, [lastMessage]);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      <div className="bg-brand-500/10 border border-brand-500/30 text-brand-300 px-5 py-4 rounded-2xl flex items-center shadow-lg shadow-brand-500/5 mb-8 backdrop-blur-md">
        <i className="fa-solid fa-circle-check mr-3 text-brand-400 text-xl"></i>
        <span className="tracking-wide">
          Hola <b className="font-bold text-gray-100">{user?.nombre} {user?.apellido}</b> — ¡sesión iniciada!
        </span>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center">
        <i className="fa-solid fa-chart-pie mr-3 text-brand-500"></i>
        Resumen de postulaciones
      </h2>

      {loading && (
        <div className="flex justify-center items-center text-gray-400 py-12 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl">
          <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-medium tracking-wide">Cargando estadísticas...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-2xl flex items-center shadow-lg backdrop-blur-md mb-6">
          <i className="fa-solid fa-triangle-exclamation mr-3 text-xl"></i>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {!loading && counts && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 sm:mb-4 md:mb-4 lg:mb-6 mb-4">
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 text-center shadow-xl shadow-black/50 hover:-translate-y-1 hover:shadow-green-500/10 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <h6 className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-center gap-2"><i className="fa-solid fa-award"></i> Destacadas</h6>
              <h3 className="text-5xl font-extrabold text-gray-100 drop-shadow-md">{counts.destacada}</h3>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500"></div>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 text-center shadow-xl shadow-black/50 hover:-translate-y-1 hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <h6 className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-center gap-2"><i className="fa-regular fa-star"></i> Posibles</h6>
              <h3 className="text-5xl font-extrabold text-gray-100 drop-shadow-md">{counts.posible}</h3>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"></div>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 text-center shadow-xl shadow-black/50 hover:-translate-y-1 hover:shadow-red-500/10 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <h6 className="text-red-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-center gap-2"><i className="fa-regular fa-circle-xmark"></i> Descartadas</h6>
              <h3 className="text-5xl font-extrabold text-gray-100 drop-shadow-md">{counts.descartada}</h3>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500"></div>
            </div>


          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6 sm:mb-6 mb-4 lg:mb-6 md:mb-6">
            <div className="group bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 text-center shadow-xl shadow-black/50 hover:-translate-y-1 hover:shadow-brand-500/10 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <h6 className="text-brand-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-center gap-2"><i className="fa-solid fa-sparkles"></i> Nuevas</h6>
              <h3 className="text-5xl font-extrabold text-gray-100 drop-shadow-md">{counts.nueva}</h3>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500"></div>
            </div>
            <div className="group bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 text-center shadow-xl shadow-black/50 hover:-translate-y-1 hover:shadow-gray-500/10 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <h6 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-center gap-2"><i className="fa-solid fa-layer-group"></i> Total</h6>
              <h3 className="text-5xl font-extrabold text-gray-100 drop-shadow-md">{counts.total}</h3>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-500"></div>
            </div>
          </div>


        </>
      )}
    </div>

  );
}
