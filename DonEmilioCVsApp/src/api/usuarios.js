// src/api/usuarios.js
import { apiFetch } from "./client";

export const UsuariosAPI = {
  list: () => apiFetch("/usuarios", { method: "GET" }),
  getById: (id) => apiFetch(`/usuarios/${id}`, { method: "GET" }),

  create: (payload) =>
    apiFetch("/usuarios", {
      method: "POST",
      apiKey: "<Donemilio@2025>",        //apiKey: true si seteaste global
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    apiFetch(`/usuarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id) => apiFetch(`/usuarios/${id}`, { method: "DELETE" }),
};
