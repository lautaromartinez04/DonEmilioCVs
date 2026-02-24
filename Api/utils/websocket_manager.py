from fastapi import WebSocket
from typing import List
import json

class ConnectionManager:

    def __init__(self):
        # WebSocket -> { "id": int, "nombre": str }
        self.active_connections: dict[WebSocket, dict] = {}
        # cv_id -> set(user_id)
        # Esto es simple. Para enviar nombres, necesitamos mapear user_id -> nombre o guardar estructuras más completas.
        # Guardaremos: cv_id -> { user_id: "Nombre" }
        self.viewers: dict[int, dict[int, str]] = {}

    async def connect(self, websocket: WebSocket, user_info: dict):
        await websocket.accept()
        self.active_connections[websocket] = user_info

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            # Limpiar presencia
            user = self.active_connections[websocket]
            user_id = user.get("id")
            
            # Remover de todos los viewers
            to_notify_cvs = []
            for cv_id, viewers_map in self.viewers.items():
                if user_id in viewers_map:
                    del viewers_map[user_id]
                    to_notify_cvs.append(cv_id)
            
            del self.active_connections[websocket]

            return to_notify_cvs

    async def broadcast(self, event_type: str, data: dict):
        """
        Envía un mensaje JSON a todos los clientes conectados.
        """
        message = json.dumps({"type": event_type, "payload": data})
        # Iterar sobre una copia
        for connection in list(self.active_connections.keys()):
            try:
                await connection.send_text(message)
            except Exception:
                # La desconexión se maneja en el router o aquí
                pass

    async def handle_message(self, websocket: WebSocket, data: dict):
        """
        Maneja mensajes del cliente: ENTER_VIEW, EXIT_VIEW
        """
        msg_type = data.get("type")
        payload = data.get("payload", {})
        user = self.active_connections.get(websocket)
        
        if not user: return

        if msg_type == "ENTER_VIEW":
            cv_id = int(payload.get("cvId", 0))
            if cv_id:
                if cv_id not in self.viewers:
                    self.viewers[cv_id] = {}
                self.viewers[cv_id][user["id"]] = user["nombre"]
                await self.broadcast_viewers(cv_id)

        elif msg_type == "EXIT_VIEW":
            cv_id = int(payload.get("cvId", 0))
            if cv_id and cv_id in self.viewers:
                if user["id"] in self.viewers[cv_id]:
                    del self.viewers[cv_id][user["id"]]
                    await self.broadcast_viewers(cv_id)

    async def broadcast_viewers(self, cv_id: int):
        # Enviar lista de nombres
        current_viewers = []
        if cv_id in self.viewers:
            current_viewers = [{"id": uid, "nombre": name} for uid, name in self.viewers[cv_id].items()]
        
        await self.broadcast("VIEWERS_UPDATE", {"cvId": cv_id, "viewers": current_viewers})

manager = ConnectionManager()
