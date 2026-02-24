import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { UnidadesAPI } from "../api/unidades";
import UnidadCard from "../components/unidades/UnidadCard";
import UnidadCreateModal from "../components/unidades/UnidadCreateModal";
import UnidadEditModal from "../components/unidades/UnidadEditModal";

const toast = Swal.mixin({
  toast: true,
  position: "bottom",
  timer: 2500,
  showConfirmButton: false,
  timerProgressBar: true,
});

export default function Unidades() {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUnidad, setEditUnidad] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await UnidadesAPI.list();
      setUnidades(Array.isArray(res) ? res : res?.items || []);
    } catch (err) {
      toast.fire({ icon: "error", title: err.message || "No se pudieron cargar unidades" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreated = (u) => setUnidades((arr) => [u, ...arr]);
  const onUpdated = (u) =>
    setUnidades((arr) => arr.map((x) => (x.id === u.id ? { ...x, ...u } : x)));
  const onDeleted = async (u) => {
    const res = await Swal.fire({
      title: "Eliminar unidad",
      html: `¿Seguro que querés eliminar <b>${u.nombre}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });
    if (!res.isConfirmed) return;
    try {
      await UnidadesAPI.remove(u.id);
      setUnidades((arr) => arr.filter((x) => x.id !== u.id));
      toast.fire({ icon: "success", title: "Unidad eliminada" });
    } catch (err) {
      toast.fire({ icon: "error", title: err.message || "No se pudo eliminar" });
    }
  };

  const onPuestoCreated = (unidadId, nuevoPuesto) =>
    setUnidades((arr) =>
      arr.map((u) =>
        u.id === unidadId
          ? { ...u, puestos: [nuevoPuesto, ...(u.puestos || [])] }
          : u
      )
    );

  const onPuestoUpdated = (unidadId, puestoUpd) =>
    setUnidades((arr) =>
      arr.map((u) =>
        u.id === unidadId
          ? {
            ...u,
            puestos: (u.puestos || []).map((p) =>
              p.id === puestoUpd.id ? { ...p, ...puestoUpd } : p
            ),
          }
          : u
      )
    );

  const onPuestoDeleted = (unidadId, puestoId) =>
    setUnidades((arr) =>
      arr.map((u) =>
        u.id === unidadId
          ? { ...u, puestos: (u.puestos || []).filter((p) => p.id !== puestoId) }
          : u
      )
    );

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium rounded-xl hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg hover:shadow-brand-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-brand-500" onClick={() => setShowCreate(true)}>
          <i className="fa-solid fa-plus mr-2" />
          Nueva unidad
        </button>
      </div>

      {loading ? (
        <div className="bg-gray-900 p-12 rounded-3xl border border-white/5 text-center text-gray-400 shadow-xl flex flex-col items-center justify-center backdrop-blur-xl">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-brand-500 mb-3 hover:text-brand-400 transition-colors"></i>
          <p className="font-medium tracking-wide">Cargando unidades…</p>
        </div>
      ) : unidades.length === 0 ? (
        <div className="bg-gray-900/50 p-12 rounded-3xl border border-white/10 border-dashed text-center text-gray-400 shadow-xl flex flex-col items-center justify-center backdrop-blur-sm">
          <i className="fa-regular fa-building text-5xl text-gray-600 mb-4 drop-shadow-md"></i>
          <p className="font-medium text-lg text-gray-300">No hay unidades</p>
          <p className="text-sm mt-1">Hacé click en "Nueva unidad" para comenzar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {unidades.map((u) => (
            <UnidadCard
              key={u.id}
              unidad={u}
              onEdit={() => setEditUnidad(u)}
              onDelete={() => onDeleted(u)}
              onPuestoCreated={onPuestoCreated}
              onPuestoUpdated={onPuestoUpdated}
              onPuestoDeleted={onPuestoDeleted}
              defaultCollapsed={true}   // 👈 todas arrancan cerradas
            />
          ))}
        </div>
      )}

      <UnidadCreateModal
        show={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={onCreated}
      />
      <UnidadEditModal
        show={!!editUnidad}
        onClose={() => setEditUnidad(null)}
        unidad={editUnidad}
        onUpdated={onUpdated}
      />
    </div>
  );
}
