import React, { useEffect, useMemo, useState } from "react";

/**
 * Props:
 * - unidades: [{ id, nombre, activo, puestos: [{id, nombre, descripcion, activo, unidad_id}] }]
 * - value: { q, estado, unidadId, puestoId }
 * - onChange(nextValue)
 * - estados: string[]
 */
export default function PostulacionesFilters({ unidades = [], value, onChange, estados = [] }) {
  const [local, setLocal] = useState(value);

  // sincronizar con cambios externos (normalizando estado)
  useEffect(() => {
    setLocal({
      ...value,
      estado: String(value?.estado || "").toLowerCase(),
    });
  }, [value]);

  const onField = (name, val) => {
    const next = { ...local, [name]: val };
    if (name === "unidadId") next.puestoId = ""; // reset dependiente
    setLocal(next);
    onChange?.(next);
  };

  // opciones de unidades
  const unidadOptions = useMemo(() => {
    return [{ id: "", nombre: "— Todas las unidades —" }, ...unidades];
  }, [unidades]);

  // puestos correspondientes a la unidad elegida
  const puestosDeUnidad = useMemo(() => {
    if (!local.unidadId) return [];
    const uid = String(local.unidadId);
    const u = unidades.find(x => String(x.id) === uid);
    const list = u?.puestos || [];
    return list.filter(p => p && p.nombre);
  }, [local.unidadId, unidades]);

  const puestoOptions = useMemo(() => {
    if (!local.unidadId) return [{ id: "", nombre: "Elegí una unidad" }];
    return [{ id: "", nombre: "— Puestos de la unidad —" }, ...puestosDeUnidad];
  }, [puestosDeUnidad, local.unidadId]);

  return (
    <div className="bg-gray-900/60 backdrop-blur-xl shadow-xl rounded-2xl border border-white/5 p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-300 mb-1 ml-1">Buscar</label>
          <input
            className="w-full px-4 py-2.5 bg-gray-950/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder-gray-500 text-gray-100 shadow-inner"
            placeholder="Nombre, correo o teléfono…"
            value={local.q}
            onChange={(e) => onField("q", e.target.value)}
          />
        </div>


        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-300 mb-1 ml-1">Estado</label>
          <select
            className="w-full px-4 py-2.5 bg-gray-950/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-100 shadow-inner appearance-none"
            value={local.estado ?? ""}
            onChange={(e) => onField("estado", e.target.value.toLowerCase())}
          >
            <option value="" className="bg-gray-900 text-gray-100">— Todos los estados —</option>
            {estados.map((s) => {
              const val = String(s).toLowerCase();
              return (
                <option key={val} value={val} className="bg-gray-900 text-gray-100">
                  {s}
                </option>
              );
            })}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-300 mb-1 ml-1">Unidad</label>
          <select
            className="w-full px-4 py-2.5 bg-gray-950/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-100 shadow-inner appearance-none"
            value={local.unidadId}
            onChange={(e) => onField("unidadId", e.target.value)}
          >
            {unidadOptions.map(u => (
              <option key={u.id} value={u.id} className="bg-gray-900 text-gray-100">
                {u.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-300 mb-1 ml-1">Puesto</label>
          <select
            className="w-full px-4 py-2.5 bg-gray-950/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-100 shadow-inner appearance-none disabled:opacity-50 disabled:bg-gray-900/30 disabled:cursor-not-allowed"
            value={local.puestoId}
            onChange={(e) => onField("puestoId", e.target.value)}
            disabled={!local.unidadId}
          >
            {puestoOptions.map(p => (
              <option key={p.id} value={p.id} className="bg-gray-900 text-gray-100">
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-300 mb-1 ml-1">Ordenar por</label>
          <select
            className="w-full px-4 py-2.5 bg-gray-950/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-100 shadow-inner appearance-none"
            value={local.sort || "reciente"}
            onChange={(e) => onField("sort", e.target.value)}
          >
            <option value="reciente" className="bg-gray-900 text-gray-100">Más recientes</option>
            <option value="procesado" className="bg-gray-900 text-gray-100">Últimos procesados</option>
            <option value="antiguo" className="bg-gray-900 text-gray-100">Más antiguos</option>
            <option value="nombre_az" className="bg-gray-900 text-gray-100">Nombre (A-Z)</option>
            <option value="nombre_za" className="bg-gray-900 text-gray-100">Nombre (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
