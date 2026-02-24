import React, { useState } from "react";
import PuestoQuickCreateModal from "../puestos/PuestoQuickCreateModal";
import PuestoEditModal from "../puestos/PuestoEditModal";
import { PuestosAPI } from "../../api/puestos";

export default function UnidadCard({
  unidad,
  onEdit,
  onDelete,
  onPuestoCreated,
  onPuestoUpdated,
  onPuestoDeleted,
  defaultCollapsed = true,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showCreatePuesto, setShowCreatePuesto] = useState(false);
  const [editPuesto, setEditPuesto] = useState(null);

  const handleCreated = (p) => onPuestoCreated(unidad.id, p);
  const handleUpdated = (p) => onPuestoUpdated(unidad.id, p);

  const handleDeletePuesto = async (p) => {
    await PuestosAPI.remove(p.id);
    onPuestoDeleted(unidad.id, p.id);
  };

  const puestos = unidad.puestos || [];

  return (
    <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-lg shadow-black/20 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300 border border-white/5 overflow-hidden mb-8 group">
      <div className="bg-gradient-to-r from-gray-800/80 to-transparent px-6 py-5 border-b border-white/5 flex justify-between items-center transition-colors">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-brand-400 mr-4 shadow-inner border border-white/10">
            <i className="fa-solid fa-building text-xl drop-shadow-md" />
          </div>
          <h3 className="text-xl font-bold text-gray-100 m-0 tracking-tight font-lexend">
            {unidad.nombre}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 text-gray-400 hover:text-brand-400 hover:bg-white/5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 hover:shadow-sm"
            onClick={onEdit}
            title="Editar unidad"
          >
            <i className="fa-regular fa-pen-to-square text-lg" />
          </button>
          <button
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 hover:shadow-sm opacity-0 group-hover:opacity-100"
            onClick={onDelete}
            title="Eliminar unidad"
          >
            <i className="fa-regular fa-trash-can text-lg" />
          </button>
          <div className="w-px h-8 bg-white/10 mx-2"></div>
          <button
            className={`p-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 hover:shadow-sm ${collapsed ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-brand-400 bg-brand-500/10 shadow-inner shadow-black/20 border border-brand-500/20'}`}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            <i
              className={`fa-solid fa-chevron-down text-lg transition-transform duration-300 ${collapsed ? "-rotate-90" : "rotate-0"
                }`}
            />
          </button>
        </div>
      </div>

      {/* Contenido colapsable */}
      <div
        className={`transition-all duration-500 overflow-hidden ${collapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
          }`}
      >
        <div className="p-6 md:p-8 bg-gray-900/50">
          <div className="space-y-4">
            {puestos.length === 0 ? (
              <div className="text-gray-500 flex flex-col items-center justify-center py-10 bg-gray-800/30 rounded-2xl border-2 border-dashed border-white/5 shadow-inner">
                <i className="fa-solid fa-folder-open text-3xl text-gray-600 mb-3 drop-shadow-md" />
                <span className="font-medium">Sin puestos en esta unidad</span>
              </div>
            ) : (
              puestos.map((p) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-5 bg-gray-800/80 border border-white/5 rounded-2xl hover:border-brand-500/30 hover:bg-gray-800 hover:shadow-lg hover:shadow-brand-500/10 hover:-translate-y-0.5 transition-all duration-300 group/puesto gap-4">
                  <div className="flex items-start">
                    <div className="mt-0.5 mr-4 bg-gray-900 group-hover/puesto:bg-brand-500/10 transition-colors text-brand-400 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 group-hover/puesto:border-brand-500/30">
                      <i className="fa-solid fa-briefcase drop-shadow-sm" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-200 tracking-wide text-[1.05rem]">{p.nombre}</div>
                      {p.descripcion && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{p.descripcion}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 sm:ml-4">
                    {p.activo ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 mr-2 shadow-sm">Activo</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-700/50 text-gray-400 border border-gray-600/50 mr-2 shadow-sm">Inactivo</span>
                    )}
                    <button
                      className="p-2 text-gray-500 hover:text-brand-400 hover:bg-white/5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 hover:shadow-sm"
                      onClick={() => setEditPuesto(p)}
                      title="Editar puesto"
                    >
                      <i className="fa-regular fa-pen-to-square" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 hover:shadow-sm opacity-0 group-hover/puesto:opacity-100"
                      onClick={() => handleDeletePuesto(p)}
                      title="Eliminar puesto"
                    >
                      <i className="fa-regular fa-trash-can" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              className="px-5 py-2.5 bg-gray-800 border border-white/10 hover:border-brand-500/50 hover:bg-gradient-to-r hover:from-brand-600 hover:to-brand-500 text-gray-300 hover:text-white rounded-xl font-bold tracking-wide transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/30 flex items-center shadow-lg hover:shadow-brand-500/25 active:scale-95"
              onClick={() => setShowCreatePuesto(true)}
              title="Agregar puesto"
            >
              <i className="fa-solid fa-plus mr-2" />
              Agregar puesto
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      <PuestoQuickCreateModal
        show={showCreatePuesto}
        onClose={() => setShowCreatePuesto(false)}
        unidad={unidad}
        onCreated={handleCreated}
      />
      <PuestoEditModal
        show={!!editPuesto}
        onClose={() => setEditPuesto(null)}
        puesto={editPuesto}
        onUpdated={handleUpdated}
        unidades={[unidad]}
      />
    </div>
  );
}
