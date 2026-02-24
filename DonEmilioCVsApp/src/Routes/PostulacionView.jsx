// src/Routes/PostulacionView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PostulacionesAPI } from "../api/postulaciones";
import { UnidadesAPI } from "../api/unidades";
import { UsuariosAPI } from "../api/usuarios";
import DecidirEstadoModal from "../components/postulaciones/DecidirEstadoModal";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";

// helpers simples
const fmt = (v) => (v ?? v === 0 ? String(v) : "-");
const TZ = "America/Argentina/Buenos_Aires"; // GMT-3

// Fuerza UTC si la fecha no tiene timezone (reemplaza espacio por T y agrega Z)
const parseDate = (s) => {
  if (!s) return null;
  let iso = s.replace(" ", "T");
  if (!iso.endsWith("Z") && !iso.includes("+") && iso.length <= 19) {
    iso += "Z";
  }
  return new Date(iso);
};

const fdt = (s) => (s ? parseDate(s).toLocaleString("es-AR", {
  timeZone: TZ,
  hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
}) : "-");

const fdate = (s) => (s ? parseDate(s).toLocaleDateString("es-AR", { timeZone: TZ }) : "-");
const fbool = (v) => (v === true ? "Sí" : v === false ? "No" : "-");

export default function PostulacionView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { enterCv, exitCv, activeViewers, lastMessage, isConnected } = useWebSocket();

  // Presencia: avisar que estoy viendo este CV
  useEffect(() => {
    if (id && isConnected) {
      enterCv(Number(id));
    }
    return () => {
      // isConnected can be false here and socket might be closing,
      // but exitCv handles it safely.
      if (id) exitCv(Number(id));
    }
  }, [id, isConnected, enterCv, exitCv]);

  // Handle Updates Realtime
  useEffect(() => {
    if (lastMessage?.type === "POSTULACION_UPDATED" && lastMessage.payload?.id === Number(id)) {
      setPostulacion((prev) => ({ ...(prev || {}), ...lastMessage.payload }));
      setMsg("La postulación fue actualizada externamente.");
    }
  }, [lastMessage, id]);

  const viewersReference = activeViewers[id] || [];
  // Excluirme a mí mismo si quiero, o mostrar todo.
  // Mostramos todos menos yo:
  const otherViewers = viewersReference.filter((v) => v.id !== user?.id);

  // datos de la postulación
  const [postulacion, setPostulacion] = useState(null);

  // catálogos
  const [unidades, setUnidades] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // nombres resueltos (fallback si backend no trae .unidad/.puesto)
  const [unidadNombre, setUnidadNombre] = useState("-");
  const [puestoNombre, setPuestoNombre] = useState("-");

  // cv
  const [blob, setBlob] = useState(null);
  const [cvUrl, setCvUrl] = useState(null);

  // ui
  const [err, setErr] = useState("");
  const [cvErr, setCvErr] = useState("");  // error específico del CV
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // modal decidir
  const [decidirItem, setDecidirItem] = useState(null);

  // Cargar catálogos (unidades con puestos + usuarios)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resU = await UnidadesAPI.list({ include_inactive: true });
        if (!mounted) return;
        const arrU = Array.isArray(resU) ? resU : resU?.items || [];
        setUnidades(arrU);
      } catch {
        if (!mounted) return;
        setUnidades([]);
      }
      try {
        const resUsers = await UsuariosAPI.list();
        if (!mounted) return;
        const arrUsers = Array.isArray(resUsers) ? resUsers : resUsers?.items || [];
        setUsuarios(arrUsers);
      } catch {
        if (!mounted) return;
        setUsuarios([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Maps para resolver nombres
  const unidadById = useMemo(
    () => new Map(unidades.map((u) => [String(u.id), u])),
    [unidades]
  );
  const puestoById = useMemo(() => {
    const m = new Map();
    unidades.forEach((u) => (u.puestos || []).forEach((p) => m.set(String(p.id), p)));
    return m;
  }, [unidades]);
  const userById = useMemo(
    () => new Map(usuarios.map((u) => [u.id, u])),
    [usuarios]
  );

  // Cargar datos + CV (blob autenticado)
  useEffect(() => {
    let mounted = true;
    let revoke = null;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        setCvErr("");
        setMsg("");
        setPostulacion(null);
        setBlob(null);
        setCvUrl(null);
        setUnidadNombre("-");
        setPuestoNombre("-");

        // 1) datos del postulante
        const p = await PostulacionesAPI.get(id);
        if (!mounted) return;
        setPostulacion(p);
      } catch (e) {
        console.error("PostulacionView error:", e);
        if (!mounted) return;
        setErr(e?.payload?.detail || e?.message || "No se pudo cargar la información");
      } finally {
        if (mounted) setLoading(false);
      }

      // 2) CV como blob autenticado (fallo separado, no bloquea la vista)
      try {
        const b = await PostulacionesAPI.cvInlineBlob(id);
        if (!mounted) return;
        setBlob(b);
        const url = URL.createObjectURL(b);
        setCvUrl(url);
        revoke = () => URL.revokeObjectURL(url);
      } catch (e) {
        if (!mounted) return;
        const detail = e?.payload?.detail || e?.message || "";
        setCvErr(detail || "El archivo CV no está disponible en el servidor");
      }
    })();

    return () => {
      mounted = false;
      if (revoke) revoke();
    };
  }, [id]);

  // Resolver nombres de unidad y puesto
  useEffect(() => {
    if (!postulacion) return;

    const unidadId = postulacion?.unidad?.id ?? postulacion?.unidad_id ?? null;
    const puestoId = postulacion?.puesto?.id ?? postulacion?.puesto_id ?? null;

    const uName = postulacion?.unidad?.nombre || null;
    const pName = postulacion?.puesto?.nombre || null;

    if (uName) setUnidadNombre(uName);
    if (pName) setPuestoNombre(pName);

    if (!uName && unidadId) {
      const u = unidadById.get(String(unidadId));
      if (u?.nombre) setUnidadNombre(u.nombre);
    }
    if (!pName && puestoId) {
      const p = puestoById.get(String(puestoId));
      if (p?.nombre) setPuestoNombre(p.nombre);
    }

    if (!uName && !unidadById.get(String(unidadId)) && unidadId) {
      setUnidadNombre(`#${unidadId}`);
    }
    if (!pName && !puestoById.get(String(puestoId)) && puestoId) {
      setPuestoNombre(`#${puestoId}`);
    }
  }, [postulacion, unidadById, puestoById]);

  const abrirNuevaPestana = () => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    window.open(u, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(u), 10000);
  };

  // callback cuando el modal confirma la decisión
  const onDecidido = (updated) => {
    if (!updated) return;
    setPostulacion((prev) => ({ ...(prev || {}), ...updated }));
    setMsg("Decisión guardada correctamente");
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      {/* Header superior */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h4 className="text-2xl font-bold text-gray-800 m-0 inline-block align-middle font-lexend">
            Previsualización de CV
          </h4>
          {otherViewers.length > 0 && (
            <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 animate-[fadeIn_0.5s_ease-out] align-middle border border-amber-200 shadow-sm">
              <i className="fa-solid fa-eye mr-1.5"></i>
              {otherViewers.length === 1
                ? `+1 persona viendo`
                : `+${otherViewers.length} personas viendo`}
              <span className="font-normal ml-1 opacity-75">
                ({otherViewers.map(v => v.nombre).join(", ")})
              </span>
            </span>
          )}
        </div>
        <Link to="/postulaciones" className="inline-flex px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-white/10 rounded-xl shadow-md text-sm font-semibold text-gray-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-brand-500">
          <i className="fa-solid fa-arrow-left mr-2 mt-0.5" /> Volver
        </Link>
      </div>

      {loading && <div className="text-gray-500 font-medium my-4"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Cargando…</div>}
      {!loading && err && <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-xl text-amber-800"><i className="fa-solid fa-triangle-exclamation mr-2"></i>{err}</div>}
      {!loading && cvErr && (
        <div className="bg-gray-800/60 border border-white/10 rounded-2xl p-4 mb-6 flex items-center gap-3 text-gray-400">
          <i className="fa-regular fa-file-slash text-2xl text-gray-600"></i>
          <div>
            <p className="text-sm font-semibold text-gray-300">Archivo CV no disponible</p>
            <p className="text-xs mt-0.5">{cvErr}</p>
          </div>
        </div>
      )}
      {!loading && msg && <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-xl text-green-800"><i className="fa-solid fa-check mr-2"></i>{msg}</div>}

      {/* Isla 1: datos + acciones */}
      {!loading && !err && (
        <div className="bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 rounded-3xl border border-white/5 overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-6">
              <div>
                <div className="text-2xl font-extrabold text-gray-100 tracking-tight">
                  {fmt(postulacion?.nombre)} {fmt(postulacion?.apellido)}
                </div>
                <div className="text-gray-400 font-medium mt-1 flex flex-wrap gap-2 items-center">
                  <span className="flex items-center"><i className="fa-solid fa-envelope mr-1.5 text-gray-500"></i>{fmt(postulacion?.correo)}</span>
                  <span className="text-gray-600">•</span>
                  <span className="flex items-center"><i className="fa-solid fa-phone mr-1.5 text-gray-500"></i>{fmt(postulacion?.telefono)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-2 md:mt-0 w-full md:w-auto">
                <button
                  className="flex-1 md:flex-none justify-center inline-flex items-center px-4 py-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold rounded-xl hover:bg-brand-500/20 hover:border-brand-500/40 transition-all shadow-lg hover:shadow-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  onClick={abrirNuevaPestana}
                  disabled={!blob}>
                  <i className="fa-solid fa-arrow-up-right-from-square mr-2"></i> Abrir
                </button>
                <a
                  className={`flex-1 md:flex-none justify-center inline-flex items-center px-4 py-2 bg-gray-800 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700 hover:border-white/20 transition-all shadow-lg hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-gray-500/40 font-bold ${!cvUrl ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                  href={cvUrl || "#"}
                  download={`cv_${postulacion?.apellido || id}.pdf`}
                  onClick={(e) => { if (!cvUrl) e.preventDefault(); }}
                >
                  <i className="fa-solid fa-download mr-2"></i> Descargar
                </a>
                <button
                  className="flex-1 md:flex-none justify-center inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 border border-transparent rounded-xl text-white font-bold hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg hover:shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-brand-500/30"
                  onClick={() => setDecidirItem(postulacion)}
                  disabled={!postulacion}
                >
                  <i className="fa-solid fa-gavel mr-2"></i> Decidir
                </button>
              </div>
            </div>

            <hr className="my-6 border-white/5" />

            {/* Datos breves */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="text-sm text-gray-300"><strong className="font-bold text-gray-500 uppercase tracking-wider text-xs block mb-1">Unidad</strong> <span className="text-base font-bold text-gray-100">{unidadNombre}</span></div>
              <div className="text-sm text-gray-300"><strong className="font-bold text-gray-500 uppercase tracking-wider text-xs block mb-1">Puesto</strong> <span className="text-base font-bold text-gray-100">{puestoNombre}</span></div>
            </div>

            <hr className="my-6 border-white/5" />

            {/* Datos del postulante (NUEVOS + nota) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <div className="col-span-1 md:col-span-2 text-sm text-gray-300 bg-gray-800/50 p-4 rounded-xl border border-white/5 shadow-inner"><strong className="font-bold text-brand-400 mr-2"><i className="fa-solid fa-comment-dots text-brand-500/50 mr-1.5"></i>Nota:</strong> {fmt(postulacion?.nota)}</div>

              <div className="text-sm text-gray-200"><strong className="font-bold text-gray-500 w-24 inline-block">DNI:</strong> {fmt(postulacion?.dni)}</div>
              <div className="text-sm text-gray-200"><strong className="font-bold text-gray-500 w-24 inline-block">F. Nacimiento:</strong> {fdate(postulacion?.fecha_nacimiento)}</div>

              <div className="text-sm text-gray-200"><strong className="font-bold text-gray-500 w-24 inline-block">Estado civil:</strong> {fmt(postulacion?.estado_civil)}</div>
              <div className="text-sm text-gray-200"><strong className="font-bold text-gray-500 w-24 inline-block">Hijos:</strong> {fbool(postulacion?.hijos)}</div>

              <div className="text-sm text-gray-200"><strong className="font-bold text-gray-500 w-24 inline-block">Domicilio:</strong> {fmt(postulacion?.domicilio_residencia)}</div>
              <div className="text-sm text-gray-200"><strong className="font-bold text-gray-500 w-24 inline-block">Localidad:</strong> {fmt(postulacion?.localidad)}</div>

              <div className="col-span-1 md:col-span-2 text-xs text-gray-500 font-medium mt-2"><i className="fa-regular fa-clock mr-1"></i> Postulado el {fdt(postulacion?.created_at)}</div>
            </div>

            <hr className="my-6 border-white/5" />

            {/* Fechas y decisión actual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 bg-gray-800/30 p-5 rounded-xl border border-white/5 shadow-inner">
              <div className="col-span-1 md:col-span-2 flex items-center mb-1">
                <strong className="font-bold text-gray-400 mr-3">Estado actual:</strong>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${postulacion?.estado?.toLowerCase() === "destacada"
                    ? "bg-green-500/20 text-green-400 border-green-500/30 border shadow-sm"
                    : postulacion?.estado?.toLowerCase() === "posible"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30 border shadow-sm"
                      : postulacion?.estado?.toLowerCase() === "descartada"
                        ? "bg-red-500/20 text-red-400 border-red-500/30 border shadow-sm"
                        : postulacion?.estado?.toLowerCase() === "nueva"
                          ? "bg-brand-500/20 text-brand-400 border-brand-500/30 border shadow-sm"
                          : "bg-gray-700/50 text-gray-400 border-gray-600/50 border shadow-sm"
                    }`}
                >
                  {fmt(postulacion?.estado)}
                </span>
              </div>

              <div className="text-sm text-gray-300">
                <strong className="font-bold text-gray-500 mr-2">Decidido en:</strong>{" "}
                {postulacion?.decidido_en ? fdt(postulacion.decidido_en) : "-"}
                <span className="font-bold text-gray-500 ml-1">por</span>
                <span className="text-sm italic text-white ml-1">
                  {(() => {
                    const uid = postulacion?.decidido_por_user_id;
                    if (!uid) return "-";
                    const u = userById.get(uid);
                    return u ? `${u.nombre} ${u.apellido}`.trim() : `#${uid}`;
                  })()}
                </span>
              </div>


              <div className="col-span-1 md:col-span-2 text-sm text-gray-300 mt-1">
                <strong className="font-bold text-gray-500 mr-2 flex items-start float-left">Motivo:</strong>{" "}
                <span className="block pl-14 italic text-gray-400">{fmt(postulacion?.decidido_motivo)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Isla 2: visor del CV grande */}
      {!loading && !err && cvUrl && (
        <div className="bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 rounded-3xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-gray-800/50">
            <span className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center"><i className="fa-regular fa-file-pdf mr-2 text-red-500/80 text-lg"></i>Documento PDF</span>
          </div>
          <div className="p-1">
            <object
              data={cvUrl}
              type="application/pdf"
              className="w-full rounded-2xl bg-gray-800"
              style={{
                display: "block",
                minHeight: "85vh",
              }}
            >
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center min-h-[50vh]">
                <i className="fa-regular fa-file-pdf text-6xl text-gray-700 mb-4 drop-shadow-md"></i>
                <p className="mb-4 font-medium text-gray-400">Tu navegador no soporta la previsualización directa de este PDF.</p>
                <a href={cvUrl} download={`cv_${postulacion?.apellido || id}.pdf`} className="inline-flex items-center px-5 py-2.5 border border-white/10 shadow-lg hover:shadow-brand-500/20 text-sm font-bold rounded-xl text-white bg-gray-800 hover:bg-gray-700 hover:border-brand-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                  <i className="fa-solid fa-download mr-2"></i> Descargar archivo PDF
                </a>
              </div>
            </object>
          </div>
        </div>
      )}

      {/* Modal para decidir */}
      <DecidirEstadoModal
        show={!!decidirItem}
        item={decidirItem}
        onClose={() => setDecidirItem(null)}
        onDecidido={onDecidido}
      />
    </div>
  );
}
