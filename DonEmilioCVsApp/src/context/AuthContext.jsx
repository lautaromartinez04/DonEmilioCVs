// src/context/AuthContext.jsx
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState
} from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { API_BASE, setAuthToken, apiFetch } from "../api/client";

const AuthContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

// Toast abajo centrado
const toast = Swal.mixin({
  toast: true,
  position: "bottom",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

const STORAGE_KEYS = {
  TOKEN: "auth.token",
  USER: "auth.user",
  EXPIRES_AT: "auth.expiresAt",
  REMEMBER: "auth.remember",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null); // ISO string UTC
  const [remember, setRemember] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const refreshTimerRef = useRef(null);

  const setToken = useCallback((t) => {
    setTokenState(t);
    setAuthToken(t);
  }, []);

  const clearTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const scheduleExpiryWatcher = useCallback(() => {
    clearTimer();
    if (!expiresAt) return;

    const now = Date.now();
    const exp = Date.parse(expiresAt); // ISO UTC -> ms
    const bufferMs = 60 * 1000; // 1 minuto antes
    const at = Math.max(exp - now - bufferMs, 0);

    refreshTimerRef.current = setTimeout(async () => {
      // No tenemos /refresh: verificamos sesión con /usuarios/me
      try {
        await apiFetch("/usuarios/me", { method: "GET" });
        // Programamos cierre exacto en exp
        const msLeft = Math.max(exp - Date.now(), 0);
        setTimeout(() => {
          toast.fire({ icon: "warning", title: "Sesión expirada" });
          logout(false);
        }, msLeft);
      } catch {
        toast.fire({ icon: "warning", title: "Sesión expirada" });
        logout(false);
      }
    }, at);
  }, [expiresAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((u, t, expISO, rem) => {
    const tgt = rem ? localStorage : sessionStorage;
    tgt.setItem(STORAGE_KEYS.TOKEN, t);
    tgt.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
    tgt.setItem(STORAGE_KEYS.EXPIRES_AT, expISO || "");
    tgt.setItem(STORAGE_KEYS.REMEMBER, rem ? "1" : "0");
  }, []);

  const unpersist = useCallback(() => {
    [localStorage, sessionStorage].forEach((s) => {
      Object.values(STORAGE_KEYS).forEach((k) => s.removeItem(k));
    });
  }, []);

  // ---- Login usando apiFetch (mantiene la API del AuthContext) ----
  const login = useCallback(async (email, password, rememberMe) => {
    let data;
    // Intento 1: /auth/login
    try {
      data = await apiFetch("/usuarios/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    } catch {
      // Intento 2: /usuarios/login (compatibilidad)
      data = await apiFetch("/usuarios/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    }

    const { access_token, user: uResp, expires_at } = data || {};
    if (!access_token) throw new Error("Token no recibido");

    setRemember(!!rememberMe);
    setToken(access_token);

    // Si el login no devolvió usuario, lo traemos
    let u = uResp || null;
    if (!u) {
      try {
        u = await apiFetch("/usuarios/me", { method: "GET" });
      } catch {
        u = null;
      }
    }
    setUser(u);
    setExpiresAt(expires_at || null);

    // Limpiar y guardar en el storage correcto
    unpersist();
    persist(u, access_token, expires_at || "", !!rememberMe);

    toast.fire({ icon: "success", title: `Bienvenido, ${u?.nombre || "Admin"} 👋` });

    scheduleExpiryWatcher();
    return data;
  }, [persist, scheduleExpiryWatcher, setToken, unpersist]);

  const logout = useCallback((notify = true) => {
    clearTimer();
    setUser(null);
    setToken(null);
    setExpiresAt(null);
    unpersist();
    if (notify) {
      toast.fire({ icon: "info", title: "Sesión cerrada" });
    }
  }, [unpersist, setToken]);

  // Rehidratación al cargar la app (una sola vez)
  useEffect(() => {
    const fromLocal = localStorage.getItem(STORAGE_KEYS.TOKEN);

    const useLocal = !!fromLocal;
    const store = useLocal ? localStorage : sessionStorage;

    const t = store.getItem(STORAGE_KEYS.TOKEN);
    const uRaw = store.getItem(STORAGE_KEYS.USER);
    const expISO = store.getItem(STORAGE_KEYS.EXPIRES_AT);
    const rem = store.getItem(STORAGE_KEYS.REMEMBER) === "1";

    try {
      setRemember(rem);
      if (t) {
        setToken(t);
        setUser(uRaw ? JSON.parse(uRaw) : null);
        setExpiresAt(expISO || null);
      }
    } catch {
      unpersist();
    } finally {
      setInitialized(true);
    }
  }, [setToken, unpersist]);

  // Programar/limpiar watcher de expiración
  useEffect(() => {
    if (token && expiresAt) {
      scheduleExpiryWatcher();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [token, expiresAt, scheduleExpiryWatcher]);

  // Leer preferencia de 'remember' aunque no haya token
  useEffect(() => {
    const remLocal = localStorage.getItem(STORAGE_KEYS.REMEMBER);
    const remSession = sessionStorage.getItem(STORAGE_KEYS.REMEMBER);
    if (remLocal !== null || remSession !== null) {
      setRemember(remLocal === "1" || (remLocal === null && remSession === "1"));
    }
  }, []);

  const value = useMemo(() => ({
    user, token, expiresAt,
    remember, setRemember,
    login, logout,
    isAuthed: !!token,
    initialized,
  }), [user, token, expiresAt, remember, login, logout, initialized]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
