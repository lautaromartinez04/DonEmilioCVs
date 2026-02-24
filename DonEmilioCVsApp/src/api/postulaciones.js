// src/api/postulaciones.js
import { apiFetch, apiFetchBlob } from "./client";

export const PostulacionesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.estado) qs.set("estado", params.estado);            // nueva/destacada/posible/descartada
    if (params.unidad_id) qs.set("unidad_id", params.unidad_id);
    if (params.puesto_id) qs.set("puesto_id", params.puesto_id);
    if (params.limit) qs.set("limit", params.limit);               // paginación
    if (typeof params.offset === "number") qs.set("offset", params.offset);
    if (params.sort) qs.set("sort", params.sort);                   // ordenamiento
    const suf = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/postulaciones${suf}`, { method: "GET" });
  },

  get: (id) => apiFetch(`/postulaciones/${id}`, { method: "GET" }),

  // actualizar metadatos (NO estado)
  update: (id, data) => apiFetch(`/postulaciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),

  // cambiar estado (decidir)
  decidir: (id, data) => apiFetch(`/postulaciones/${id}/decidir`, {
    method: "POST",
    body: JSON.stringify(data), // { estado: 'destacada'|'posible'|'descartada', motivo?: string }
  }),

  // eliminar postulación
  remove: (id) => apiFetch(`/postulaciones/${id}`, { method: "DELETE" }),

  // === CV ===
  // Endpoint protegido que devuelve el PDF inline; lo pedimos como blob con Authorization
  cvInlineBlob: (id) => apiFetchBlob(`/postulaciones/${id}/cv/inline`, { method: "GET" }),

  // (Opcional) URL directa NO RECOMENDADA porque no envía Authorization en navegaciones:
  // cvUrl: (item) => `${API_BASE}/postulaciones/${item?.id}/cv`,

};
