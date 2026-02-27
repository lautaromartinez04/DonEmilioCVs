// src/api/client.js
const API_BASE = import.meta.env.VITE_API_URL || "http://192.168.0.25:8000";

let _authToken = null;    // JWT Bearer (para admins)
let _apiKey = "Donemilio@2026";       // X-API-Key global
let _basicUser = null;    // Basic Auth global (usuario)
let _basicPass = null;    // Basic Auth global (password)

/**
 * Guardar/actualizar el token JWT en memoria
 * @param {string|null} token
 */
export function setAuthToken(token) {
  _authToken = token || null;
}

/**
 * Setear API Key global (se enviará si la llamada pide apiKey: true)
 * @param {string|null} key
 */
export function setApiKey(key) {
  _apiKey = key || null;
}

/**
 * Setear credenciales Basic Auth globales (se usarán si la llamada pide basic: true)
 * @param {string|null} user
 * @param {string|null} pass
 */
export function setBasicAuth(user, pass) {
  _basicUser = user || null;
  _basicPass = pass || null;
}

/**
 * Construye headers de auth según opciones.
 * Reglas:
 * - Por defecto usa JWT (si auth:true y hay token).
 * - Si basic:true => usa Basic y NO Bearer.
 * - API Key va en "X-API-Key" y puede coexistir con Bearer o Basic.
 *
 * @param {Headers} h
 * @param {{auth?: boolean, basic?: boolean | {user?: string, pass?: string}, apiKey?: boolean | string}} opts
 */
function applyAuthHeaders(h, opts) {
  const { auth = true, basic = false, apiKey = false } = opts || {};

  // --- API Key (X-API-Key) ---
  const keyVal = typeof apiKey === "string" ? apiKey : _apiKey;
  if (keyVal) {
    h.set("X-API-Key", keyVal);
  }

  // --- Basic Auth ---
  // basic puede ser:
  //  - true: usa credenciales globales
  //  - {user, pass}: usa esas credenciales
  //  - false/omitida: no usa Basic
  if (basic) {
    let user = _basicUser;
    let pass = _basicPass;
    if (typeof basic === "object" && basic !== null) {
      if (basic.user) user = basic.user;
      if (basic.pass) pass = basic.pass;
    }
    if (user && pass) {
      const token = btoa(`${user}:${pass}`);
      h.set("Authorization", `Basic ${token}`);
      return; // Si usamos Basic, NO ponemos Bearer
    }
  }

  // --- Bearer (JWT) ---
  if (auth && _authToken) {
    h.set("Authorization", `Bearer ${_authToken}`);
  }
}

/**
 * apiFetch: wrapper de fetch con baseURL y auth por llamada
 * @param {string} path - ej. "/usuarios/me"
 * @param {RequestInit & { auth?: boolean, basic?: boolean|{user?:string,pass?:string}, apiKey?: boolean|string }} options
 */
export async function apiFetch(path, options = {}) {
  // --- DEMO MODE INTERCEPTION ---
  const DEMO_MODE = false; // Force demo mode for portfolio

  if (DEMO_MODE) {
    console.log(`[DEMO API] ${options.method || 'GET'} ${path}`);
    await new Promise(r => setTimeout(r, 600)); // Simulate network latency

    if (path === "/usuarios/login") {
      return { access_token: "demo_token_123", token_type: "bearer" };
    }
    if (path === "/usuarios/me") {
      return { ...import('./mockData').then(m => m.MOCK_DATA.user) }; // Async dynamic import or simplified below
    }

    // Simple Router for Mock Data
    const { MOCK_DATA } = await import('./mockData');

    if (path === "/usuarios/me") return MOCK_DATA.user;
    if (path === "/postulaciones/counts") return MOCK_DATA.counts;

    if (path.startsWith("/postulaciones")) {
      // List
      if (path === "/postulaciones" || path.includes("?")) return MOCK_DATA.postulaciones;
      // Get One
      const idMatch = path.match(/\/postulaciones\/(\d+)$/);
      if (idMatch) {
        const id = parseInt(idMatch[1]);
        return MOCK_DATA.postulaciones.find(p => p.id === id) || null;
      }
    }

    if (path.startsWith("/unidades-negocio")) return MOCK_DATA.unidades;
    if (path.startsWith("/puestos")) return MOCK_DATA.puestos;

    // Default catch-all for unknown mock paths
    console.warn(`[DEMO API] No mock data for ${path}, returning empty object.`);
    return {};
  }
  // -----------------------------

  const { headers, ...rest } = options;
  const h = new Headers(headers || {});
  h.set("Accept", "application/json");

  // Si hay body y no es FormData, ponemos JSON
  if (!h.has("Content-Type") && rest?.body && !(rest.body instanceof FormData)) {
    h.set("Content-Type", "application/json");
  }

  // Aplica Bearer/Basic/API-Key según opciones
  applyAuthHeaders(h, options);

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: h });

  if (!res.ok) {
    let payload = null;
    try { payload = await res.json(); } catch { /* ignore */ }

    let errMsg = `HTTP ${res.status}`;
    if (payload?.detail) {
      if (Array.isArray(payload.detail)) {
        errMsg = payload.detail.map(d => {
          const field = d.loc?.length > 1 ? d.loc[d.loc.length - 1] : d.loc?.[0];
          return field ? `${field}: ${d.msg}` : d.msg;
        }).join(" | ");
      } else if (typeof payload.detail === "string") {
        errMsg = payload.detail;
      } else {
        errMsg = JSON.stringify(payload.detail);
      }
    } else if (payload?.message) {
      errMsg = payload.message;
    }

    const err = new Error(errMsg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  // 204 No Content → null
  if (res.status === 204) return null;

  // Normalmente JSON
  return res.json();
}

/**
 * apiFetchBlob: igual que apiFetch pero esperando BLOB (PDF, imgs, etc.)
 * @param {string} path
 * @param {RequestInit & { auth?: boolean, basic?: boolean|{user?:string,pass?:string}, apiKey?: boolean|string }} options
 * @returns {Promise<Blob>}
 */
export async function apiFetchBlob(path, options = {}) {
  const { headers, ...rest } = options;
  const h = new Headers(headers || {});
  if (!h.has("Accept")) h.set("Accept", "*/*");
  // NO forzar Content-Type: el servidor lo define

  // Aplica Bearer/Basic/API-Key según opciones
  applyAuthHeaders(h, options);

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: h });

  if (!res.ok) {
    let payload = null;
    try { payload = await res.json(); } catch { /* ignore */ }
    const err = new Error(payload?.detail || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return res.blob();
}

export { API_BASE };
