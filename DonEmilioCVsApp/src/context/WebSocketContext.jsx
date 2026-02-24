// src/context/WebSocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_BASE } from "../api/client";
import { useAuth } from "./AuthContext";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
    const { user, loading } = useAuth(); // Esperar a que cargue el user
    const [lastMessage, setLastMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Mapa de viewers: { cvId: [ { id, nombre }, ... ] }
    const [activeViewers, setActiveViewers] = useState({});

    // Usamos useRef para el socket y para el timer de reconexión
    const socketRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    const connect = React.useCallback(() => {
        // Si no hay usuario o todavía carga, no conectamos (o podríamos conectar como anónimo si quisiéramos)
        if (loading || !user) return;

        // Si ya hay conexión o intento en curso
        if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        // URL con params: id y nombre
        const wsBase = API_BASE.replace(/^http/, "ws") + "/ws";
        const url = `${wsBase}?id=${user.id}&nombre=${encodeURIComponent(user.nombre || "User")}`;

        console.log("[WS] Connecting...", url);
        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("[WS] Connected");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "VIEWERS_UPDATE") {
                    // payload: { cvId: 1, viewers: [...] }
                    const { cvId, viewers } = data.payload;
                    setActiveViewers(prev => ({ ...prev, [cvId]: viewers }));
                } else {
                    console.log("[WS] Message:", data);
                    setLastMessage(data);
                }
            } catch (e) {
                console.warn("[WS] Error parsing", e);
            }
        };

        ws.onclose = () => {
            console.log("[WS] Disconnected");
            if (socketRef.current === ws) {
                setIsConnected(false);
                socketRef.current = null;
                // Retry
                retryTimeoutRef.current = setTimeout(connect, 3000);
            }
        };

        ws.onerror = (err) => {
            console.error("[WS] Error", err);
            ws.close();
        };
    }, [user, loading]);

    useEffect(() => {
        if (!loading && user) {
            connect();
        }
        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (socketRef.current) socketRef.current.close();
        };
    }, [user, loading, connect]);

    // Métodos para enviar presencia (stable)
    const enterCv = React.useCallback((cvId) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "ENTER_VIEW", payload: { cvId } }));
        }
    }, []);

    const exitCv = React.useCallback((cvId) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "EXIT_VIEW", payload: { cvId } }));
        }
    }, []);

    const value = React.useMemo(() => ({
        isConnected, lastMessage, activeViewers, enterCv, exitCv
    }), [isConnected, lastMessage, activeViewers, enterCv, exitCv]);

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWebSocket() {
    return useContext(WebSocketContext);
}
