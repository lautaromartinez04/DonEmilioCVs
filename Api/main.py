import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from config.database import Base, engine
from middlewares.error_handler import ErrorHandler
from routers.usuarios import router as usuarios_router
from routers.puestos import router as puestos_router
from routers.unidades_negocio import router as unidades_router
from routers.postulaciones import router as postulaciones_router
from routers.websockets import router as websockets_router

load_dotenv()
app = FastAPI(title="API CVs", version="1.1.0")

# ⛑️ CORS PRIMERO y con orígenes explícitos (no "*")
# ⛑️ CORS PRIMERO y con orígenes explícitos (no "*")
# ALLOWED_ORIGINS = [ ... ]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",     # Permissive for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type", "Cache-Control"],
)

# luego tus middlewares propios
app.add_middleware(ErrorHandler)

# Routers (sin /api/v1 según dijiste)
app.include_router(usuarios_router)
app.include_router(puestos_router)
app.include_router(unidades_router)
app.include_router(postulaciones_router)
app.include_router(websockets_router)

# Solo dev; en prod usar Alembic
Base.metadata.create_all(bind=engine)

@app.get("/", tags=["home"])
def home():
    return {"ok": True}

# --- STATICS FRONTEND SERVING ---
# Servir la app de "form" en /form
if os.path.exists("form"):
    app.mount("/form/assets", StaticFiles(directory="form/assets", html=False), name="form-assets")

    @app.get("/form/{full_path:path}", include_in_schema=False)
    async def serve_form(full_path: str):
        filepath = os.path.join("form", full_path)
        if os.path.isfile(filepath):
            return FileResponse(filepath)
        return FileResponse("form/index.html")

# Servir la app de "admin" en /admin
if os.path.exists("admin"):
    app.mount("/admin/assets", StaticFiles(directory="admin/assets", html=False), name="admin-assets")

    @app.get("/admin/{full_path:path}", include_in_schema=False)
    async def serve_admin(full_path: str):
        filepath = os.path.join("admin", full_path)
        if os.path.isfile(filepath):
            return FileResponse(filepath)
        return FileResponse("admin/index.html")
