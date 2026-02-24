import React from "react";
import { useNavigate, Link } from "react-router-dom";


function estadoBadgeClass(s) {
  const S = (s || "").toLowerCase();
  if (S === "nueva") return "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border-brand-500/30 border";
  if (S === "destacada") return "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-500/20 text-green-300 border-green-500/30 border";
  if (S === "posible") return "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border-amber-500/30 border";
  if (S === "descartada") return "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border-red-500/30 border";
  return "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-800 text-gray-300 border-gray-700 border";
}

function formatDateAR(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return "-";
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "medium" });
}

export default function PostulacionCard({
  item,
  onDecidir,
  onDelete,
  unidadById,
  puestoById,
  userById,
  viewers = [],
}) {
  const navigate = useNavigate();

  const estado = (item.estado || "").toLowerCase();
  const fecha = formatDateAR(item.created_at || item.decidido_en);

  // Resolver Unidad / Puesto (cast a Number por si vienen como string)
  const unidadNombre =
    item?.unidad?.nombre ??
    item?.unidad_nombre ??
    unidadById?.get?.(Number(item.unidad_id))?.nombre ??
    "-";

  const puestoNombre =
    item?.puesto?.nombre ??
    item?.puesto_nombre ??
    puestoById?.get?.(Number(item.puesto_id))?.nombre ??
    "-";

  // Decidido por: nombre de usuario si está disponible
  const decidedUser = userById?.get?.(Number(item.decidido_por_user_id)) || null;
  const decididoPor =
    decidedUser?.nombre || decidedUser?.full_name || decidedUser?.username ||
    (item.decidido_por_user_id ? `#${item.decidido_por_user_id}` : "");

  const descripcion = item.nota ?? item.descripcion ?? "";

  const goDetalle = () => navigate(`/postulaciones/${item.id}`);

  return (
    <div className="bg-gray-900/60 backdrop-blur-xl shadow-xl shadow-black/50 hover:shadow-2xl hover:shadow-brand-500/20 hover:-translate-x-1 transition-all duration-300 rounded-2xl border border-white/5 p-4 lg:p-5 flex flex-col group relative overflow-hidden gap-4">
      {/* Subtle glow effect behind card */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>

      {/* Top Main Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 relative z-10 w-full">

        {/* Info Principal: Avatar, Nombre y Fecha */}
        <div className="flex items-center gap-4 min-w-[280px] w-full md:w-auto relative z-10 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600/20 to-brand-400/20 flex items-center justify-center text-brand-400 shadow-inner border border-brand-500/30 group-hover:scale-105 transition-transform duration-300 backdrop-blur-md shrink-0">
            <i className="fa-regular fa-id-card text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link className="text-xl font-bold text-gray-100 hover:text-brand-400 transition-colors decoration-transparent focus:outline-none truncate" to={`/postulaciones/${item.id}`}>
                {item.nombre} {item.apellido}
              </Link>
              {viewers.length > 0 && (
                <span className="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shadow-sm" title={`Viendo ahora: ${viewers.map(v => v.nombre).join(", ")}`}>
                  <i className="fa-regular fa-eye mr-1" />
                  {viewers.length}
                </span>
              )}
            </div>
            <small className="text-xs text-gray-500 font-semibold tracking-wide flex items-center mt-1">
              <i className="fa-regular fa-clock mr-1.5" /> {fecha}
            </small>
          </div>
        </div>

        {/* Info Medio: Contacto y Posición */}
        <div className="hidden lg:grid grid-cols-2 gap-x-8 gap-y-1.5 flex-1 relative z-10 min-w-0 px-4 border-l border-white/5 disabled:border-none">
          <div className="text-sm text-gray-400 flex items-center group/info hover:text-gray-200 transition-colors min-w-0">
            <div className="w-5 flex justify-center shrink-0"><i className="fa-regular fa-envelope text-gray-500 group-hover/info:text-brand-400 transition-colors text-xs" /></div>
            <span className="truncate tracking-wide ml-1.5">{item.correo || "-"}</span>
          </div>
          <div className="text-sm text-gray-400 flex items-center group/info hover:text-gray-200 transition-colors min-w-0">
            <div className="w-5 flex justify-center shrink-0"><i className="fa-solid fa-building text-gray-500 group-hover/info:text-brand-400 transition-colors text-xs" /></div>
            <span className="truncate tracking-wide ml-1.5">{unidadNombre}</span>
          </div>
          <div className="text-sm text-gray-400 flex items-center group/info hover:text-gray-200 transition-colors min-w-0">
            <div className="w-5 flex justify-center shrink-0"><i className="fa-solid fa-phone text-gray-500 group-hover/info:text-brand-400 transition-colors text-xs" /></div>
            <span className="truncate tracking-wide ml-1.5">{item.telefono || "-"}</span>
          </div>
          <div className="text-sm text-gray-300 flex items-center group/info hover:text-brand-300 transition-colors min-w-0">
            <div className="w-5 flex justify-center shrink-0"><i className="fa-solid fa-briefcase text-gray-500 group-hover/info:text-brand-400 transition-colors text-xs" /></div>
            <span className="truncate font-semibold ml-1.5">{puestoNombre}</span>
          </div>
        </div>

        {/* Mobile Only: Compact info */}
        <div className="flex lg:hidden flex-wrap gap-3 text-xs text-gray-400 w-full mb-2">
          <span className="truncate"><i className="fa-solid fa-building mr-1 text-gray-500" />{unidadNombre}</span>
          <span className="truncate font-semibold text-gray-300"><i className="fa-solid fa-briefcase mr-1 text-gray-500" />{puestoNombre}</span>
          <span className="truncate"><i className="fa-solid fa-phone mr-1 text-gray-500" />{item.telefono || "-"}</span>
        </div>

        {/* Resolucion / Estado */}
        <div className="flex flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto relative z-10 shrink-0 gap-3">
          <span className={estadoBadgeClass(estado) + " shadow-sm w-fit"}>
            {estado ? estado[0].toUpperCase() + estado.slice(1) : "-"}
          </span>

          <div className="flex items-center gap-2">
            {/* Eliminar (solo hover en desktop) */}
            <button
              className="p-2 border border-red-500/20 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 focus:outline-none shadow-sm hover:shadow-md active:scale-95 opacity-100 md:opacity-0 group-hover:opacity-100"
              title="Eliminar registro"
              onClick={() => onDelete(item)}
            >
              <i className="fa-regular fa-trash-can" />
            </button>

            {/* Cambiar estado */}
            <button
              className="px-4 py-2 border border-white/10 bg-gray-800 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 focus:outline-none shadow-sm hover:shadow active:scale-95 text-sm font-bold tracking-wide"
              title="Cambiar estado"
              onClick={() => onDecidir(item)}
            >
              Decidir
            </button>

            {/* Ver */}
            <button
              className="px-5 py-2 border border-transparent bg-gradient-to-r from-brand-600 to-brand-500 rounded-xl text-white hover:from-brand-500 hover:to-brand-400 transition-all duration-300 focus:outline-none shadow-md hover:shadow-brand-500/20 active:scale-95 text-sm font-bold tracking-wide"
              title="Ver detalle de postulación"
              onClick={goDetalle}
            >
              Ver
            </button>
          </div>
        </div>
      </div> {/* <-- Closes Top Main Row */}

      {/* Bottom Conditional Row for Desc / Resolution */}
      {(!!descripcion || item.decidido_motivo || decididoPor) && (
        <div className="pt-3 mt-1 border-t border-white/5 w-full relative z-10 flex flex-col gap-3">
          {!!descripcion && (
            <div className="text-sm text-gray-400 line-clamp-2 italic" title={descripcion}>
              "{descripcion}"
            </div>
          )}
          {(item.decidido_motivo || decididoPor) && (
            <div className="text-xs text-gray-400 bg-brand-900/20 p-2.5 rounded-xl border border-brand-500/20 shadow-sm w-fit">
              <strong className="font-bold text-brand-300">Resolución:</strong>
              <span className="ml-1 italic font-medium text-gray-300">
                {item.decidido_motivo ? `${item.decidido_motivo}` : ""}
                {item.decidido_motivo && decididoPor ? " · " : ""}
                {decididoPor ? `por ${decididoPor}` : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
