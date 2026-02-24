// src/Routes/Puestos.jsx
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { PuestosAPI } from "../api/puestos";
import { UnidadesAPI } from "../api/unidades";
import PuestoCreateModal from "../components/puestos/PuestoCreateModal";
import PuestoEditModal from "../components/puestos/PuestoEditModal";

const toast = Swal.mixin({
  toast: true,
  position: "bottom",
  timer: 2500,
  showConfirmButton: false,
  timerProgressBar: true,
});

export default function Puestos() {
  const [data, setData] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [q, setQ] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const loadUnidades = async () => {
    try {
      const res = await UnidadesAPI.list();
      setUnidades(res || []);
    } catch (err) {
      toast.fire({ icon: "error", title: err.message || "No se pudieron cargar unidades" });
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await PuestosAPI.list({
        unidad_id: unidadId || undefined,
        include_inactive: includeInactive,
      });
      setData(Array.isArray(res) ? res : res?.items || []);
    } catch (err) {
      toast.fire({ icon: "error", title: err.message || "No se pudieron cargar puestos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUnidades(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [unidadId, includeInactive]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((p) =>
      [p.nombre, p.descripcion, p.unidad?.nombre, String(p.id)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [q, data]);

  const onDelete = async (p) => {
    const res = await Swal.fire({
      title: "Eliminar puesto",
      html: `¿Seguro que querés eliminar <b>${p.nombre}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });
    if (!res.isConfirmed) return;
    try {
      await PuestosAPI.remove(p.id);
      setData((arr) => arr.filter((x) => x.id !== p.id));
      toast.fire({ icon: "success", title: "Puesto eliminado" });
    } catch (err) {
      toast.fire({ icon: "error", title: err.message || "No se pudo eliminar" });
    }
  };

  const onCreated = (nuevo) => {
    setData((arr) => [nuevo, ...arr]);
  };

  const onUpdated = (upd) => {
    setData((arr) => arr.map((x) => (x.id === upd.id ? { ...x, ...upd } : x)));
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium rounded-xl hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg hover:shadow-brand-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-brand-500" onClick={() => setShowCreate(true)}>
          <i className="fa-solid fa-briefcase mr-2 drop-shadow-sm" />
          Nuevo puesto
        </button>
      </div>

      <div className="bg-gray-900/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/5 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="col-span-1">
            <input
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder-gray-500 text-gray-100 shadow-inner"
              placeholder="Buscar por nombre, unidad, descripción o ID…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="col-span-1">
            <select
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-200 shadow-inner"
              value={unidadId}
              onChange={(e) => setUnidadId(e.target.value)}
            >
              <option value="">— Todas las unidades —</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1 flex items-center pt-1 md:pt-0 pl-1 md:pl-2">
            <div className="flex items-center">
              <input
                id="incInact"
                type="checkbox"
                className="h-4 w-4 text-brand-500 bg-gray-800/80 border-white/10 focus:ring-brand-500/50 rounded cursor-pointer transition-colors shadow-inner"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              <label htmlFor="incInact" className="ml-2 block text-sm font-medium text-gray-300 cursor-pointer select-none">Incluir inactivos</label>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 flex flex-col justify-center items-center">
            <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-4 text-brand-500 drop-shadow-lg"></i>
            <span className="font-medium tracking-wide">Cargando puestos…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 bg-gray-800/30 rounded-2xl border border-white/5 border-dashed shadow-inner flex flex-col items-center justify-center">
            <i className="fa-solid fa-briefcase text-4xl mb-4 text-gray-600 drop-shadow-md"></i>
            <p className="font-medium text-lg">Sin resultados</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-800/80 border-b border-white/5">
                  <th className="px-5 py-4 font-semibold text-gray-400 w-20 tracking-wider text-xs uppercase">ID</th>
                  <th className="px-5 py-4 font-semibold text-gray-400 tracking-wider text-xs uppercase">Puesto</th>
                  <th className="px-5 py-4 font-semibold text-gray-400 tracking-wider text-xs uppercase">Unidad</th>
                  <th className="px-5 py-4 font-semibold text-gray-400 tracking-wider text-xs uppercase">Descripción</th>
                  <th className="px-5 py-4 font-semibold text-gray-400 w-32 tracking-wider text-xs uppercase">Estado</th>
                  <th className="px-5 py-4 font-semibold text-gray-400 w-32 tracking-wider text-xs uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-gray-900/50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-800/50 transition-colors group">
                    <td className="px-5 py-4 align-middle text-gray-500 font-medium">#{p.id}</td>
                    <td className="px-5 py-4 align-middle font-bold text-gray-200 tracking-wide">{p.nombre}</td>
                    <td className="px-5 py-4 align-middle text-gray-400 font-medium bg-gray-800/20"><span className="px-2.5 py-1 bg-gray-800 rounded-lg border border-white/5 shadow-inner">{p.unidad?.nombre ?? "-"}</span></td>
                    <td className="px-5 py-4 align-middle text-gray-400 truncate max-w-xs">{p.descripcion || "-"}</td>
                    <td className="px-5 py-4 align-middle">
                      {p.activo ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm">Activo</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-700/50 text-gray-400 border border-gray-600/50 shadow-sm">Inactivo</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="flex gap-2">
                        <button
                          className="p-2 bg-gray-800 border border-white/10 rounded-xl text-gray-400 hover:text-brand-400 hover:bg-white/5 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50 flex items-center justify-center shrink-0"
                          title="Editar"
                          onClick={() => setEditItem(p)}
                        >
                          <i className="fa-regular fa-pen-to-square" />
                        </button>
                        <button
                          className="p-2 bg-gray-800 border border-white/10 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 flex items-center justify-center shrink-0"
                          title="Eliminar"
                          onClick={() => onDelete(p)}
                        >
                          <i className="fa-regular fa-trash-can" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      <PuestoCreateModal
        show={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={onCreated}
        unidades={unidades}
      />
      <PuestoEditModal
        show={!!editItem}
        onClose={() => setEditItem(null)}
        onUpdated={onUpdated}
        unidades={unidades}
        puesto={editItem}
      />
    </div>
  );
}
