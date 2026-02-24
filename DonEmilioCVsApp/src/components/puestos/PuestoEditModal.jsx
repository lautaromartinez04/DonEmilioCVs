import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { PuestosAPI } from "../../api/puestos";

const toast = Swal.mixin({
  toast: true, position: "bottom", timer: 2500,
  showConfirmButton: false, timerProgressBar: true,
});

export default function PuestoEditModal({ show, onClose, onUpdated, unidades, puesto }) {
  const [form, setForm] = useState({ nombre: "", descripcion: "", unidad_id: "", activo: true });
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (show && puesto) {
      setForm({
        nombre: puesto.nombre || "",
        descripcion: puesto.descripcion || "",
        unidad_id: puesto.unidad?.id || puesto.unidad_id || "",
        activo: !!puesto.activo,
      });
      setTimeout(() => ref.current?.querySelector("input[name='nombre']")?.focus(), 0);
    }
  }, [show, puesto]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!form.nombre.trim()) return "El nombre es obligatorio";
    if (!form.unidad_id) return "Seleccioná la unidad";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.fire({ icon: "warning", title: err });

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        unidad_id: Number(form.unidad_id),
        activo: !!form.activo,
      };
      const updated = await PuestosAPI.update(puesto.id, payload);
      toast.fire({ icon: "success", title: "Puesto actualizado" });
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
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 w-full max-w-lg overflow-hidden animate-[fadeIn_0.2s_ease-out]" ref={ref} onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
          <h5 className="text-lg font-bold text-gray-100 m-0 font-lexend">Editar puesto</h5>
          <button type="button" className="text-gray-400 hover:text-red-400 hover:bg-white/5 p-2 rounded-lg transition-colors focus:outline-none" onClick={onClose}><i className="fa-solid fa-xmark text-lg" /></button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1 ml-1">Nombre</label>
              <input className="w-full px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder-gray-500 text-gray-100" name="nombre" value={form.nombre} onChange={onChange} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1 ml-1">Unidad</label>
              <select className="w-full px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-100" name="unidad_id" value={form.unidad_id} onChange={onChange}>
                <option value="">— Elegí una unidad —</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1 ml-1">Descripción <span className="text-gray-500 font-normal">(opcional)</span></label>
              <textarea className="w-full px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder-gray-500 text-gray-100 resize-none" rows="3" name="descripcion" value={form.descripcion} onChange={onChange} />
            </div>
            <div className="flex items-center pt-2 ml-1">
              <input id="pe-activo" className="h-4 w-4 text-brand-500 bg-gray-900 border-white/20 focus:ring-brand-500/50 rounded cursor-pointer transition-colors" type="checkbox" name="activo" checked={form.activo} onChange={onChange} />
              <label className="ml-2 block text-sm font-medium text-gray-300 cursor-pointer select-none" htmlFor="pe-activo">Activo</label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/5 bg-gray-900/50 flex justify-end gap-3">
            <button type="button" className="px-4 py-2 bg-gray-800 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 border border-transparent rounded-xl text-white font-medium hover:from-brand-500 hover:to-brand-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center shadow-lg hover:shadow-brand-500/25 disabled:opacity-75 disabled:cursor-not-allowed" disabled={saving}>{saving ? <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Guardando</> : "Guardar cambios"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
