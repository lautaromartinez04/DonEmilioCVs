// src/api/unidades.js
import { apiFetch } from "./client";

export const UnidadesAPI = {
  list: () => apiFetch("/unidades-negocio", { method: "GET" }),
  get: (id) => apiFetch(`/unidades-negocio/${id}`, { method: "GET" }),
  create: (payload) =>
    apiFetch("/unidades-negocio", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) =>
    apiFetch(`/unidades-negocio/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id) => apiFetch(`/unidades-negocio/${id}`, { method: "DELETE" }),
};
