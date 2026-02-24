import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { UnidadesAPI } from "../../api/unidades";

const toast = Swal.mixin({
  toast: true, position: "bottom", timer: 2500,
  showConfirmButton: false, timerProgressBar: true,
});

export default function UnidadEditModal({ show, onClose, unidad, onUpdated }) {
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (show && unidad) {
      setForm({ nombre: unidad.nombre || "", descripcion: unidad.descripcion || "" });
      setTimeout(() => ref.current?.querySelector("input[name='nombre']")?.focus(), 0);
    }
  }, [show, unidad]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.fire({ icon: "warning", title: "El nombre es obligatorio" });
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
      };
      const updated = await UnidadesAPI.update(unidad.id, payload);
      toast.fire({ icon: "success", title: "Unidad actualizada" });
      onUpdated?.(updated);
      onClose?.();
    } catch (err) {
      toast.fire({ icon: "error", title: err.message || "No se pudo actualizar" });
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]" ref={ref} onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
          <h5 className="text-lg font-bold text-gray-100 m-0 font-lexend">Editar unidad</h5>
          <button type="button" className="text-gray-400 hover:text-red-400 hover:bg-white/5 p-2 rounded-lg transition-colors focus:outline-none" onClick={onClose}>
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1 ml-1">Nombre</label>
              <input className="w-full px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder-gray-500 text-gray-100" name="nombre" value={form.nombre} onChange={onChange} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1 ml-1">Descripción <span className="text-gray-500 font-normal">(opcional)</span></label>
              <textarea className="w-full px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder-gray-500 text-gray-100 resize-none" rows="3" name="descripcion" value={form.descripcion} onChange={onChange} />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/5 bg-gray-900/50 flex justify-end gap-3">
            <button type="button" className="px-4 py-2 bg-gray-800 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 border border-transparent rounded-xl text-white font-medium hover:from-brand-500 hover:to-brand-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center shadow-lg hover:shadow-brand-500/25 disabled:opacity-75 disabled:cursor-not-allowed" disabled={saving}>
              {saving ? <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Guardando</> : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
