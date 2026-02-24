import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { PostulacionesAPI } from "../../api/postulaciones";
import { apiFetch } from "../../api/client";
import { useWebSocket } from "../../context/WebSocketContext";

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const boxRef = useRef(null);
  const { lastMessage } = useWebSocket();

  // Mapea ruta → título
  const getTitle = (path) => {
    const p = (path || "").replace(/\/+$/, "");
    if (p.startsWith("/postulaciones")) return "Postulaciones";
    if (p.startsWith("/unidades")) return "Unidades de negocio";
    if (p.startsWith("/puestos")) return "Puestos";
    if (p.startsWith("/usuarios")) return "Usuarios";
    return "Dashboard";
  };
  const title = getTitle(location.pathname);

  // cerrar dropdown si clicás afuera
  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // ---- Contador de "nuevas" usando /postulaciones/counts (con fallback) ----
  const fetchNewCount = async (signal) => {
    try {
      setLoadingCount(true);

      // 1) Endpoint nuevo: rápido y sin paginar
      try {
        const counts = await apiFetch("/postulaciones/counts", { method: "GET", signal });
        if (counts && typeof counts.nueva === "number") {
          setNewCount(counts.nueva);
          return; // listo
        }
        throw new Error("Counts endpoint sin 'nueva'");
      } catch {
        // 2) Fallback: traigo 200 y filtro en el front (por si counts no está)
        const SAFE_LIMIT = 200;
        const page = await PostulacionesAPI.list({ limit: SAFE_LIMIT, offset: 0, signal });
        const nuevas = Array.isArray(page)
          ? page.filter(p => String(p.estado || "").trim().toLowerCase() === "nueva").length
          : 0;
        setNewCount(nuevas);
      }
    } catch {
      setNewCount(0);
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    const run = () => fetchNewCount(ctrl.signal);
    run();

    // refresco automático cada 60s
    const id = setInterval(run, 60_000);

    // refresco al volver a la pestaña
    const onVisibility = () => { if (document.visibilityState === "visible") run(); };
    // refresco manual desde otras vistas
    const onCustomRefresh = () => run();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("postulaciones:refresh-count", onCustomRefresh);

    return () => {
      ctrl.abort();
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("postulaciones:refresh-count", onCustomRefresh);
    };
  }, [location.pathname]); // refresca también al cambiar de ruta

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  const handleManualRefresh = () => {
    const ctrl = new AbortController();
    fetchNewCount(ctrl.signal);
  };

  // Escuchar por WebSockets para actualizar el contador automáticamente
  useEffect(() => {
    if (!lastMessage) return;
    if (["POSTULACION_CREATED", "POSTULACION_DELETED", "POSTULACION_UPDATED"].includes(lastMessage.type)) {
      handleManualRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  return (
    <header className="h-16 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 shadow-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-100 m-0 tracking-tight hidden sm:block font-[Lexend]">{title}</h1>
      </div>

      {/* DERECHA: contador + usuario */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Icono con badge (click refresca manualmente) */}
        <button
          type="button"
          className="relative p-2.5 text-gray-400 hover:text-brand-400 hover:bg-gray-800 transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 hover:shadow-sm group"
          title="Postulaciones nuevas"
          onClick={handleManualRefresh}
          aria-label="Refrescar nuevas"
        >
          <i className={`fa-solid fa-file-arrow-up text-[1.35rem] drop-shadow-sm group-hover:scale-110 transition-transform duration-300 ${loadingCount ? 'animate-pulse text-brand-500/50' : ''}`} aria-hidden="true" />
          {!loadingCount && newCount > 0 && (
            <span className="absolute top-0.5 right-0.5 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-[2px] border-white shadow-sm" aria-live="polite" aria-atomic="true">
              {newCount > 99 ? '99+' : newCount}
            </span>
          )}
        </button>

        {/* Píldora fija + panel flotante */}
        <div ref={boxRef} className="relative">
          <button
            type="button"
            className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-white/5 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="true"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md">
              <span className="text-sm font-bold uppercase drop-shadow-md">{user?.nombre?.charAt(0) || 'U'}</span>
            </div>
            <span className="text-sm font-semibold text-gray-200 hidden md:block tracking-wide">
              {user?.nombre} {user?.apellido}
            </span>
            <i className={`fa-solid fa-chevron-down text-[10px] text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
          </button>

          {/* Menú Desplegable */}
          <div className={`absolute right-0 mt-3 w-56 bg-gray-900 rounded-2xl shadow-2xl border border-white/10 transition-all duration-300 origin-top-right ${open ? "opacity-100 scale-100 translate-y-0 visible" : "opacity-0 scale-95 -translate-y-2 invisible"}`}>
            <div className="p-2">
              <button
                className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
                onClick={handleLogout}
              >
                <i className="fa-solid fa-right-from-bracket w-6 text-center mr-2 text-lg drop-shadow-sm" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
