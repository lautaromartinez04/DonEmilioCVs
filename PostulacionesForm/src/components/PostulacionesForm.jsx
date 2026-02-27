import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, fetchUnidadesNegocio } from "../api";
import Swal from "sweetalert2";

const MAX_CV_MB = 25;

export default function PostulacionForm() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    puesto_id: "",
    unidad_id: "",
    nota: "",

    // Nuevos campos (requeridos)
    dni: "",
    fecha_nacimiento: "",   // YYYY-MM-DD
    estado_civil: "",
    hijos: "",              // "true" | "false"
    domicilio_residencia: "",
    localidad: "",
  });
  const [cv, setCv] = useState(null);

  // Unidades / Puestos
  const [unidades, setUnidades] = useState([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [errUnidades, setErrUnidades] = useState("");

  // Estado de envío / errores
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingUnidades(true);
        setErrUnidades("");
        const raw = await fetchUnidadesNegocio();

        const onlyActive = raw
          .filter((u) => u?.activo)
          .map((u) => ({
            id: u.id,
            nombre: u.nombre,
            descripcion: u.descripcion,
            activo: true,
            puestos: Array.isArray(u.puestos)
              ? u.puestos
                .filter((p) => p?.activo)
                .map((p) => ({
                  id: p.id,
                  nombre: p.nombre,
                  descripcion: p.descripcion,
                  unidad_id: p.unidad_id,
                }))
              : [],
          }));

        if (mounted) {
          setUnidades(onlyActive);
          if (onlyActive.length === 1) {
            const unica = onlyActive[0];
            setForm((f) => ({ ...f, unidad_id: String(unica.id), puesto_id: "" }));
          }
        }
      } catch (err) {
        if (mounted) setErrUnidades(err.message || "No se pudieron cargar las unidades.");
      } finally {
        if (mounted) setLoadingUnidades(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const puestosDeUnidad = useMemo(() => {
    const uid = Number(form.unidad_id);
    if (!uid) return [];
    const u = unidades.find((x) => x.id === uid);
    return u?.puestos || [];
  }, [form.unidad_id, unidades]);

  // ===== Validaciones =====
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validateField = (name, value) => {
    switch (name) {
      case "nombre":
      case "apellido":
      case "telefono":
      case "dni":
      case "fecha_nacimiento":
      case "estado_civil":
      case "hijos":
      case "domicilio_residencia":
      case "localidad":
        return value ? "" : "Requerido";
      case "correo":
        if (!value.trim()) return "Requerido";
        if (!isEmail(value.trim())) return "Formato de email inválido";
        return "";
      case "unidad_id":
      case "puesto_id":
        return value ? "" : "Requerido";
      case "cv":
        if (!cv) return "Adjuntá tu CV en PDF";
        if (cv.type !== "application/pdf") return "El archivo debe ser PDF";
        if (cv.size > MAX_CV_MB * 1024 * 1024) return `Máximo ${MAX_CV_MB}MB`;
        return "";
      default:
        return "";
    }
  };

  const validateAll = () => {
    const e = {};
    [
      "nombre", "apellido", "correo", "telefono",
      "unidad_id", "puesto_id",
      "dni", "fecha_nacimiento", "estado_civil",
      "hijos", "domicilio_residencia", "localidad"
    ].forEach((field) => {
      const msg = validateField(field, form[field]);
      if (msg) e[field] = msg;
    });

    const cvMsg = validateField("cv", cv);
    if (cvMsg) e.cv = cvMsg;

    return e; // 'nota' es el único campo opcional
  };

  const updateFieldAndMaybeClearError = (name, value) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (next[name]) {
        const msg = validateField(name, value);
        if (!msg) delete next[name];
        else next[name] = msg;
      }
      if (name === "unidad_id" && next["puesto_id"]) {
        const puestoMsg = validateField("puesto_id", "");
        if (!puestoMsg) delete next["puesto_id"];
        else next["puesto_id"] = puestoMsg;
      }
      return next;
    });
  };

  // ===== Handlers =====
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      if (name === "unidad_id") {
        updateFieldAndMaybeClearError(name, value);
        return { ...f, unidad_id: value, puesto_id: "" };
      }
      updateFieldAndMaybeClearError(name, value);
      return { ...f, [name]: value };
    });
  };

  const onFile = (e) => {
    const file = e.target.files?.[0] || null;
    setCv(file);
    setErrors((prev) => {
      const next = { ...prev };
      if (next.cv) {
        const msg = validateField("cv", file);
        if (!msg) delete next.cv;
        else next.cv = msg;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateAll();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const first = Object.keys(newErrors)[0];
      const el = document.querySelector(`[data-field="${first}"]`);
      if (el) el.focus();
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("nombre", form.nombre.trim());
      fd.append("apellido", form.apellido.trim());
      fd.append("correo", form.correo.trim());
      fd.append("telefono", form.telefono.trim());
      fd.append("puesto_id", String(form.puesto_id).trim());
      fd.append("unidad_id", String(form.unidad_id).trim());
      fd.append("nota", form.nota.trim());
      fd.append("cv", cv, cv.name);

      // Nuevos campos
      fd.append("dni", form.dni.trim());
      fd.append("fecha_nacimiento", form.fecha_nacimiento);
      fd.append("estado_civil", form.estado_civil.trim());
      fd.append("hijos", form.hijos === "true" ? "true" : "false");
      fd.append("domicilio_residencia", form.domicilio_residencia.trim());
      fd.append("localidad", form.localidad.trim());

      // Log para verificar
      console.group("POST /postulaciones FormData");
      for (const [k, v] of fd.entries()) console.log(k, v);
      console.groupEnd();

      const res = await fetch(`${API_BASE}/postulaciones`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "X-API-Key": "Donemilio@2026"
        },
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        Swal.fire({
          icon: "error",
          title: `Error ${res.status}`,
          text: text || "Hubo un problema al enviar tu postulación. Intentalo nuevamente.",
        });
        return;
      }

      setForm({
        nombre: "",
        apellido: "",
        correo: "",
        telefono: "",
        puesto_id: "",
        unidad_id: form.unidad_id, // dejo la unidad elegida
        nota: "",
        dni: "",
        fecha_nacimiento: "",
        estado_civil: "",
        hijos: "",
        domicilio_residencia: "",
        localidad: "",
      });
      setCv(null);
      setErrors({});
      const fileInput = document.getElementById("cv-input");
      if (fileInput) fileInput.value = "";

      Swal.fire({
        icon: "success",
        title: "¡Postulación enviada!",
        text: "Gracias por postularte. Te estaremos contactando pronto.",
        confirmButtonText: "Aceptar",
        customClass: { confirmButton: "w-full font-[madetommy] px-6 py-3 bg-[#0033a1] text-white font-bold rounded-xl shadow-lg border-none" },
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor. Verificá tu conexión e intentalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = (error) =>
    `w-full px-4 py-3 bg-white/70 backdrop-blur-sm border rounded-xl focus:ring-4 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-[inset_0_2px_4px_rgb(0,0,0,0.02)] ${error ? "border-red-400 focus:ring-red-500/20 focus:bg-white bg-red-50/50" : "border-gray-200 focus:ring-[#0033a1]/10 focus:border-[#0033a1] hover:bg-white focus:bg-white focus:shadow-sm"
    }`;

  const labelClasses = "block text-sm font-bold text-gray-700 mb-2 ml-1 tracking-wide";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Nombre y Apellido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClasses}>Nombre</label>
          <input
            data-field="nombre"
            className={inputClasses(errors.nombre)}
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            maxLength={80}
            placeholder="Tu nombre"
          />
          {errors.nombre && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.nombre}</div>}
        </div>

        <div>
          <label className={labelClasses}>Apellido</label>
          <input
            data-field="apellido"
            className={inputClasses(errors.apellido)}
            name="apellido"
            value={form.apellido}
            onChange={onChange}
            maxLength={80}
            placeholder="Tu apellido"
          />
          {errors.apellido && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.apellido}</div>}
        </div>
      </div>

      {/* Correo y Teléfono */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClasses}>Correo Electrónico</label>
          <input
            data-field="correo"
            className={inputClasses(errors.correo)}
            type="email"
            name="correo"
            value={form.correo}
            onChange={onChange}
            placeholder="tu_correo@example.com"
          />
          {errors.correo && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.correo}</div>}
        </div>

        <div>
          <label className={labelClasses}>Teléfono</label>
          <input
            data-field="telefono"
            className={inputClasses(errors.telefono)}
            name="telefono"
            value={form.telefono}
            onChange={onChange}
            maxLength={20}
            placeholder="353 123 4567"
          />
          {errors.telefono && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.telefono}</div>}
        </div>
      </div>

      {/* Nuevos campos del postulante */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClasses}>DNI</label>
          <input
            data-field="dni"
            className={inputClasses(errors.dni)}
            name="dni"
            value={form.dni}
            onChange={onChange}
            maxLength={20}
            placeholder="Ej: 12.345.678"
          />
          {errors.dni && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.dni}</div>}
        </div>

        <div>
          <label className={labelClasses}>Fecha de Nacimiento</label>
          <input
            data-field="fecha_nacimiento"
            className={inputClasses(errors.fecha_nacimiento)}
            type="date"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento}
            onChange={onChange}
          />
          {errors.fecha_nacimiento && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.fecha_nacimiento}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClasses}>Estado Civil</label>
          <select
            data-field="estado_civil"
            className={inputClasses(errors.estado_civil)}
            name="estado_civil"
            value={form.estado_civil}
            onChange={onChange}
          >
            <option value="">Seleccionar</option>
            <option value="soltero">Soltero</option>
            <option value="casado">Casado</option>
            <option value="concubinato">Concubinato</option>
            <option value="viudo">Viudo</option>
          </select>
          {errors.estado_civil && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.estado_civil}</div>}
        </div>

        <div>
          <label className={labelClasses}>¿Tiene hijos?</label>
          <select
            data-field="hijos"
            className={inputClasses(errors.hijos)}
            name="hijos"
            value={form.hijos}
            onChange={onChange}
          >
            <option value="">Seleccionar</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
          {errors.hijos && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.hijos}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClasses}>Domicilio de Residencia</label>
          <input
            data-field="domicilio_residencia"
            className={inputClasses(errors.domicilio_residencia)}
            name="domicilio_residencia"
            value={form.domicilio_residencia}
            onChange={onChange}
            maxLength={200}
            placeholder="Calle, número, piso/depto"
          />
          {errors.domicilio_residencia && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.domicilio_residencia}</div>}
        </div>

        <div>
          <label className={labelClasses}>Localidad</label>
          <input
            data-field="localidad"
            className={inputClasses(errors.localidad)}
            name="localidad"
            value={form.localidad}
            onChange={onChange}
            maxLength={120}
            placeholder="Tu localidad"
          />
          {errors.localidad && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.localidad}</div>}
        </div>
      </div>

      {/* Unidad y Puesto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClasses}>Unidad de Negocio</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 w-10 text-gray-400">
              <i className="fa-solid fa-store"></i>
            </span>
            <select
              data-field="unidad_id"
              className={`${inputClasses(errors.unidad_id)} pl-11`}
              name="unidad_id"
              value={form.unidad_id}
              onChange={onChange}
              disabled={loadingUnidades || unidades.length === 0}
            >
              <option value="">
                {loadingUnidades ? "Cargando unidades..." : "Seleccioná una unidad"}
              </option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>
          {errors.unidad_id && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.unidad_id}</div>}
          {errUnidades && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errUnidades}</div>}
        </div>

        <div>
          <label className={labelClasses}>Puesto</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 w-10 text-gray-400">
              <i className="fa-solid fa-user-tie"></i>
            </span>
            <select
              data-field="puesto_id"
              className={`${inputClasses(errors.puesto_id)} pl-11`}
              name="puesto_id"
              value={form.puesto_id}
              onChange={onChange}
              disabled={!form.unidad_id || puestosDeUnidad.length === 0}
            >
              <option value="">
                {!form.unidad_id
                  ? "Elegí primero una unidad"
                  : puestosDeUnidad.length === 0
                    ? "Sin puestos activos"
                    : "Seleccioná un puesto"}
              </option>
              {puestosDeUnidad.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          {errors.puesto_id && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.puesto_id}</div>}
          {form.unidad_id && puestosDeUnidad.length === 0 && (
            <div className="text-amber-600 text-xs mt-1.5 ml-1 font-medium">
              Esta unidad no tiene puestos activos para postular.
            </div>
          )}
        </div>
      </div>

      {/* Nota (opcional) */}
      <div>
        <label className={labelClasses}>Carta de Presentación (Opcional)</label>
        <textarea
          className={inputClasses(false)}
          name="nota"
          rows={3}
          value={form.nota}
          onChange={onChange}
          maxLength={500}
          placeholder="Contanos brevemente sobre vos..."
        />
        <div className="text-xs text-gray-500 text-right mt-1 font-medium">{form.nota.length}/500</div>
      </div>

      {/* CV */}
      <div>
        <label className={labelClasses}>Curriculum Vitae (PDF)</label>
        <div className="relative group">
          <input
            id="cv-input"
            data-field="cv"
            className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#0033a1] hover:file:bg-blue-100 transition-all ${errors.cv ? "border border-red-500 rounded-xl" : ""
              }`}
            type="file"
            accept="application/pdf"
            onChange={onFile}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1.5 ml-1 font-medium">Tamaño máximo {MAX_CV_MB}MB.</div>
        {errors.cv && <div className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.cv}</div>}
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          className="w-full font-[madetommy] px-6 py-3.5 bg-gradient-to-r from-[#0033a1] to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex justify-center items-center tracking-wide text-lg disabled:opacity-70 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando Postulación...
            </>
          ) : (
            <>Enviar Postulación <i className="fa-solid fa-paper-plane ml-2"></i></>
          )}
        </button>
      </div>
    </form>
  );
}
