import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { PostulacionesAPI } from "../../api/postulaciones";

const toast = Swal.mixin({
  toast: true,
  position: "bottom",
  timer: 2500,
  showConfirmButton: false,
  timerProgressBar: true,
  background: "#1f2937",
  color: "#f3f4f6"
});

const ESTADOS = [
  { value: "Destacada", label: "Destacada" },
  { value: "Posible", label: "Posible" },
  { value: "Descartada", label: "Descartada" },
  { value: "Nueva", label: "Nueva" }
];

export default function DecidirEstadoModal({ show, onClose, item, onDecidido, unidades = [] }) {
  const [estado, setEstado] = useState("Destacada");
  const [motivo, setMotivo] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [puestoId, setPuestoId] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (show) {
      // si el estado actual ya está entre las opciones, usarlo como default
      const curr = String(item?.estado || "").toLowerCase();
      const exists = ESTADOS.some(e => e.value === curr);
      setEstado(exists ? curr : "Destacada");
      setMotivo("");
      setUnidadId(item?.unidad_id || "");
      setPuestoId(item?.puesto_id || "");
      setTimeout(() => ref.current?.querySelector("select")?.focus(), 0);
    }
  }, [show, item]);

  const submit = async (e) => {
    e.preventDefault();
    if (!estado) return;

    const unidadCambiada = unidadId && String(unidadId) !== String(item?.unidad_id);
    if (unidadCambiada && !puestoId) {
      toast.fire({ icon: "error", title: "Debes asignar un nuevo puesto obligatoriamente" });
      return;
    }

    setSaving(true);
    try {
      const formattedEstado = estado.toLowerCase();
      const finalMotivo = motivo?.trim() || "Actualización de estado";
      const payload = {
        estado: formattedEstado,
        motivo: finalMotivo,
        unidad_id: unidadId ? Number(unidadId) : null,
        puesto_id: puestoId ? Number(puestoId) : null
      };
      const upd = await PostulacionesAPI.decidir(item.id, payload);
      toast.fire({ icon: "success", title: "Estado actualizado" });
      onDecidido?.(upd);
      onClose?.();
    } catch (err) {
      toast.fire({ icon: "error", title: err.message || "No se pudo actualizar el estado" });
    } finally {
      setSaving(false);
    }
  };

  if (!show || !item) return null;

  // opciones de unidades y puestos
  const unidadOptions = [{ id: "", nombre: "— Dejar igual/Sin asignar —" }, ...unidades];
  const puestosDeUnidad = (() => {
    if (!unidadId) return [];
    const u = unidades.find(x => String(x.id) === String(unidadId));
    return (u?.puestos || []).filter(p => p && p.nombre);
  })();
  const unidadOpcionesCambio = unidadId && String(unidadId) !== String(item?.unidad_id);
  const puestoOptions = !unidadId
    ? [{ id: "", nombre: "Elegí una unidad primero" }]
    : unidadOpcionesCambio
      ? [{ id: "", nombre: "— Seleccioná un puesto (Obligatorio) —" }, ...puestosDeUnidad]
      : [{ id: "", nombre: "— Dejar igual/Sin asignar —" }, ...puestosDeUnidad];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden animate-[fadeIn_0.3s_ease-out_forwards]" ref={ref} onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
          <h5 className="text-xl font-bold text-gray-100 m-0 font-[madetommy] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-brand-400 shadow-sm border border-white/5">
              <i className="fa-solid fa-code-branch" />
            </div>
            Cambiar estado
          </h5>
          <button className="text-gray-400 hover:text-red-400 hover:bg-white/5 p-2.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 hover:shadow-sm" onClick={onClose} type="button">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <p className="text-sm text-gray-300 mb-5 bg-gray-800/50 p-4 rounded-2xl border border-white/5 shadow-sm leading-relaxed">
                Postulación de: <strong className="text-brand-400 font-bold">{item.nombre} {item.apellido}</strong>
              </p>
              <label className="block text-sm font-bold text-gray-300 mb-2 ml-1 tracking-wide">Nuevo estado</label>
              <div className="relative">
                <select className="w-full pl-4 pr-10 py-3 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-300 text-gray-100 font-medium appearance-none shadow-sm cursor-pointer" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 ml-1 tracking-wide">Unidad a asignar</label>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-3 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-300 text-gray-100 font-medium appearance-none shadow-sm cursor-pointer disabled:opacity-50"
                    value={unidadId}
                    onChange={(e) => {
                      setUnidadId(e.target.value);
                      setPuestoId(""); // reset puesto al cambiar unidad
                    }}
                  >
                    {unidadOptions.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 ml-1 tracking-wide">Puesto a asignar</label>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-3 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-300 text-gray-100 font-medium appearance-none shadow-sm cursor-pointer disabled:opacity-50"
                    value={puestoId}
                    onChange={(e) => setPuestoId(e.target.value)}
                    disabled={!unidadId}
                  >
                    {puestoOptions.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2 ml-1 tracking-wide">Motivo <span className="text-gray-500 font-normal italic">(opcional)</span></label>
              <textarea
                className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-300 placeholder-gray-500 resize-none shadow-sm font-medium text-gray-100"
                rows="3"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej.: Cumple los requisitos..."
              />
            </div>
          </div>

          <div className="px-6 py-5 border-t border-white/5 bg-gray-900/50 flex justify-end gap-3">
            <button type="button" className="px-5 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-gray-300 font-bold hover:bg-gray-700 hover:text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500/30 shadow-sm active:scale-95" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 border border-transparent rounded-xl text-white font-bold hover:from-brand-500 hover:to-brand-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/30 flex items-center shadow-lg hover:shadow-brand-500/25 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed tracking-wide" disabled={saving}>
              {saving ? <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Guardando</> : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
