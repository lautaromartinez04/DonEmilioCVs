from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.websocket_manager import manager

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, id: int = 0, nombre: str = "Anonimo"):
    # Simplificación: pasar usuario por query params ?id=1&nombre=Juan
    # En prod idealmente validaríamos token.
    user_info = {"id": id, "nombre": nombre}
    
    await manager.connect(websocket, user_info)
    try:
        while True:
            data_text = await websocket.receive_text()
            # Parsear mensaje cliente
            import json
            try:
                data = json.loads(data_text)
                await manager.handle_message(websocket, data)
            except:
                pass
    except WebSocketDisconnect:
        affected_cvs = manager.disconnect(websocket)
        if affected_cvs:
            for cv_id in affected_cvs:
                await manager.broadcast_viewers(cv_id)
    except Exception:
        manager.disconnect(websocket)
