// src/Routes/Postulaciones.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { PostulacionesAPI } from "../api/postulaciones";
import { UnidadesAPI } from "../api/unidades";
import { PuestosAPI } from "../api/puestos"; // usado por PostulacionesFilters si lo mantenés
import { UsuariosAPI } from "../api/usuarios";
import PostulacionesFilters from "../components/postulaciones/PostulacionesFilters";
import PostulacionCard from "../components/postulaciones/PostulacionCard";
// import PostulacionDetailModal from "../components/postulaciones/PostulacionDetailModal"; // ❌ ya no lo usamos
import DecidirEstadoModal from "../components/postulaciones/DecidirEstadoModal";
import { useWebSocket } from "../context/WebSocketContext";

const toast = Swal.mixin({
  toast: true,
  position: "bottom",
  timer: 2500,
  showConfirmButton: false,
  timerProgressBar: true,
});

// estados reales del backend (lowercase)
const ESTADOS = ["nueva", "destacada", "posible", "descartada"];

export default function Postulaciones() {
  const navigate = useNavigate();

  // catálogos
  const [unidades, setUnidades] = useState([]); // con puestos anidados
  const [usuarios, setUsuarios] = useState([]); // para "Decidido por"

  // filtros — se restauran desde sessionStorage al volver del detalle
  const [filters, setFilters] = useState(() => {
    try {
      const saved = sessionStorage.getItem("postulaciones_filters");
      return saved ? JSON.parse(saved) : { q: "", estado: "", unidadId: "", puestoId: "", sort: "reciente" };
    } catch {
      return { q: "", estado: "", unidadId: "", puestoId: "", sort: "reciente" };
    }
  });

  // datos
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // paginado (limit/offset)
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [total, setTotal] = useState(0);

  // Persistir filtros en sessionStorage cada vez que cambian
  useEffect(() => {
    try { sessionStorage.setItem("postulaciones_filters", JSON.stringify(filters)); } catch { /* ignore */ }
  }, [filters]);

  // modales
  // const [detailItem, setDetailItem] = useState(null); // ❌ ya no
  const [decidirItem, setDecidirItem] = useState(null);

  // Carga de catálogos: Unidades (con puestos) y Usuarios
  useEffect(() => {
    (async () => {
      try {
        const resU = await UnidadesAPI.list({ include_inactive: true });
        const arrU = Array.isArray(resU) ? resU : resU?.items || [];
        setUnidades(arrU);
      } catch {
        setUnidades([]);
      }

      try {
        const resUsers = await UsuariosAPI.list();
        const arrUsers = Array.isArray(resUsers) ? resUsers : resUsers?.items || [];
        setUsuarios(arrUsers);
      } catch {
        setUsuarios([]);
      }
    })();
  }, []);

  // Maps para resolver nombres en la Card
  const unidadById = useMemo(
    () => new Map(unidades.map((u) => [u.id, u])),
    [unidades]
  );

  const puestoById = useMemo(() => {
    const m = new Map();
    unidades.forEach((u) => (u.puestos || []).forEach((p) => m.set(p.id, p)));
    return m;
  }, [unidades]);

  const userById = useMemo(
    () => new Map(usuarios.map((u) => [u.id, u])),
    [usuarios]
  );

  // (Solo si seguís usando puestos por fetch separado en los filtros)
  const fetchPuestos = async (unidadId) =>
    unidadId ? (await PuestosAPI.list({ unidad_id: unidadId })) : [];

  // Carga de postulaciones
  const load = async (pageOverride) => {
    const currentPage = pageOverride ?? page;
    setLoading(true);
    try {
      const res = await PostulacionesAPI.list({
        q: filters.q || undefined,
        estado: filters.estado || undefined, // backend espera lowercase
        unidad_id: filters.unidadId || undefined,
        puesto_id: filters.puestoId || undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        sort: filters.sort || "reciente",
      });

      if (Array.isArray(res)) {
        setItems(res);
        setTotal(res.length);
      } else {
        setItems(res.items || []);
        setTotal(res.total ?? (res.items?.length || 0));
      }
    } catch (err) {
      toast.fire({ icon: "error", title: err.message || "No se pudieron cargar postulaciones" });
    } finally {
      setLoading(false);
    }
  };

  // Cuando cambian los filtros: resetear a página 1 y cargar
  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Cuando cambia la página (sin que hayan cambiado los filtros): cargar
  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const { lastMessage } = useWebSocket();
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "POSTULACION_CREATED") {
      // Si estamos en página 1 y sin filtros complejos (o si querés ser más smart, solo reload)
      // Estrategia simple: reload
      load();
    } else if (lastMessage.type === "POSTULACION_DELETED") {
      // Quitar de la lista local si existe
      const { id } = lastMessage.payload;
      setItems(prev => {
        const exists = prev.find(i => i.id === id);
        if (!exists) return prev;
        setTotal(t => Math.max(0, t - 1));
        return prev.filter(i => i.id !== id);
      });
    } else if (lastMessage.type === "POSTULACION_UPDATED") {
      // Actualizar local
      const { id, estado } = lastMessage.payload;
      setItems(prev => prev.map(i => i.id === id ? { ...i, estado } : i));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const onDelete = async (p) => {
    const res = await Swal.fire({
      title: "Eliminar postulación",
      html: `¿Seguro que querés eliminar la postulación de <b>${p.nombre} ${p.apellido || ""}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });
    if (!res.isConfirmed) return;
    try {
      await PostulacionesAPI.remove(p.id);
      setItems((arr) => arr.filter((x) => x.id !== p.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.fire({ icon: "success", title: "Postulación eliminada" });
    } catch (err) {
      toast.fire({ icon: "error", title: err.message || "No se pudo eliminar" });
    }
  };

  // 👉 ahora ver detalle navega a la página /postulaciones/:id
  const openDetail = (p) => {
    navigate(`/postulaciones/${p.id}`);
  };

  const onDecidido = (upd) => {
    setItems((arr) => arr.map((x) => (x.id === upd.id ? { ...x, ...upd } : x)));
  };

  // valores para la isla de filtros (display capitalizado)
  const estadosDisplay = ESTADOS.map((s) => s[0].toUpperCase() + s.slice(1));

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      {/* Isla de filtros */}
      <PostulacionesFilters
        unidades={unidades}
        fetchPuestos={fetchPuestos} // si después dejas de usarlo, lo quitamos
        value={filters}
        onChange={(v) => setFilters(v)}
        estados={estadosDisplay}
      />

      {/* Grilla (now List) */}
      <div className="flex flex-col gap-4 mt-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12 flex justify-center items-center">
            <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando...
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl">
            <i className="fa-regular fa-folder-open text-4xl mb-3 text-gray-600"></i>
            <p>Sin resultados</p>
          </div>
        ) : (
          items.map((p) => (
            <PostulacionCard
              key={p.id}
              item={p}
              onDecidir={setDecidirItem}
              onView={openDetail}          // 👈 ahora navega
              onDelete={onDelete}
              unidadById={unidadById}
              puestoById={puestoById}
              userById={userById}
            />
          ))
        )}
      </div>

      {/* Paginado */}
      {!loading && total > 0 && (
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
          <div className="text-sm text-gray-400 font-medium">
            Página <span className="text-gray-100">{page}</span> de <span className="text-gray-100">{totalPages}</span> — {total} resultados
          </div>
          <div className="inline-flex rounded-xl shadow-lg bg-gray-900 overflow-hidden border border-white/10">
            <button
              className="px-4 py-2 hover:bg-gray-800 border-r border-white/10 text-gray-300 transition-colors disabled:opacity-50 disabled:bg-gray-900 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:z-10"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Anterior"
            >
              <i className="fa-solid fa-angle-left" />
            </button>
            <button
              className="px-4 py-2 hover:bg-gray-800 text-gray-300 transition-colors disabled:opacity-50 disabled:bg-gray-900 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:z-10"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Siguiente"
            >
              <i className="fa-solid fa-angle-right" />
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      <DecidirEstadoModal
        show={!!decidirItem}
        item={decidirItem}
        onClose={() => setDecidirItem(null)}
        onDecidido={onDecidido}
      />
    </div>
  );
}
