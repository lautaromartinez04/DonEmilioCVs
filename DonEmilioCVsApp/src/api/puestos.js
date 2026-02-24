// src/api/puestos.js
import { apiFetch } from "./client";

export const PuestosAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.unidad_id) qs.set("unidad_id", params.unidad_id);
    if (params.include_inactive) qs.set("include_inactive", "1");
    const suf = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/puestos${suf}`, { method: "GET" });
  },
  getById: (id) => apiFetch(`/puestos/${id}`, { method: "GET" }),
  create: (payload) =>
    apiFetch("/puestos", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) =>
    apiFetch(`/puestos/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id) => apiFetch(`/puestos/${id}`, { method: "DELETE" }),
};
