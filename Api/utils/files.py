import os
import re
import uuid
import unicodedata
from typing import Tuple
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
from fastapi import UploadFile, HTTPException

load_dotenv()

STORAGE_DIR = os.getenv("STORAGE_DIR", "storage").strip()
MAX_CV_MB = int(os.getenv("MAX_CV_MB", "10"))
ALLOWED_EXTS = {e.strip().lower() for e in os.getenv("CV_ALLOWED_EXTS", ".pdf,.doc,.docx").split(",")}
TIMEZONE = os.getenv("TIMEZONE")  # ej: America/Argentina/Cordoba

def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)

def secure_basename(filename: str) -> str:
    return os.path.basename(filename or "upload")

def validate_ext(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Extensión no permitida: {ext}. Permitidas: {', '.join(sorted(ALLOWED_EXTS))}")
    return ext

_slug_re = re.compile(r"[^a-z0-9]+")
def slugify(text: str) -> str:
    text = (text or "").strip()
    # quitar acentos → ascii
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = _slug_re.sub("-", text).strip("-")
    return text or "x"

def build_cv_filename(nombre: str, apellido: str, ext: str) -> str:
    now = datetime.now(timezone.utc)
    if TIMEZONE:
        try:
            now = now.astimezone(ZoneInfo(TIMEZONE))
        except Exception:
            pass  # si falla, queda en UTC
    stamp = now.strftime("%Y%m%d_%H%M%S")
    base = f"{slugify(nombre)}_{slugify(apellido)}_{stamp}{ext}"
    return base

def unique_path(dirpath: str, filename: str) -> str:
    # Evita colisión: agrega -2, -3, ...
    name, ext = os.path.splitext(filename)
    candidate = os.path.join(dirpath, filename)
    i = 2
    while os.path.exists(candidate):
        candidate = os.path.join(dirpath, f"{name}-{i}{ext}")
        i += 1
    return candidate

def save_upload_file_cv(file: UploadFile, nombre: str, apellido: str) -> Tuple[str, int, str]:
    """
    Guarda el archivo en STORAGE_DIR/cv/ como 'nombre_apellido_YYYYMMDD_HHMMSS.ext'
    Retorna (stored_name, size_bytes, mime_type).
    """
    ensure_dir(os.path.join(STORAGE_DIR, "cv"))
    original = secure_basename(file.filename)
    ext = validate_ext(original)

    filename = build_cv_filename(nombre, apellido, ext)
    dest_path = unique_path(os.path.join(STORAGE_DIR, "cv"), filename)

    max_bytes = MAX_CV_MB * 1024 * 1024
    size = 0
    with open(dest_path, "wb") as out:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > max_bytes:
                try:
                    out.close()
                    os.remove(dest_path)
                except Exception:
                    pass
                raise HTTPException(status_code=413, detail=f"El archivo supera el límite de {MAX_CV_MB}MB")
            out.write(chunk)

    mime = file.content_type or "application/octet-stream"
    stored_name = os.path.basename(dest_path)
    return stored_name, size, mime

def cv_disk_path(stored_name: str) -> str:
    return os.path.join(STORAGE_DIR, "cv", stored_name)
