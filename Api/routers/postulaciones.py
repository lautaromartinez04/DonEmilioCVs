# routers/postulaciones.py
from fastapi import (
    APIRouter, Depends, HTTPException,
    UploadFile, File, Form, Query, status,
    BackgroundTasks
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from config.database import get_db
from services.postulaciones import PostulacionesService
from schemas.postulaciones import PostulacionOut, PostulacionUpdate, PostulacionDecisionIn
from utils.files import save_upload_file_cv, cv_disk_path
from utils.authz import admin_required
from utils.mailer import send_mail
from utils.email_templates import candidate_confirmation, admin_new_cv
from models.unidades_negocio import UnidadNegocio
from models.puestos import Puesto
from models.postulaciones import Postulacion
import os
from datetime import date
from urllib.parse import quote
from utils.websocket_manager import manager

router = APIRouter(prefix="/postulaciones", tags=["Postulaciones"])

ADMIN_EMAILS = [e.strip() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()]


@router.get("/counts", dependencies=[Depends(admin_required)])
def counts_por_estado(db: Session = Depends(get_db)):
    """
    Devuelve conteos por estado (case-insensitive) + total.
    Keys normalizadas en minúscula: nueva, destacada, posible, descartada, total.
    """
    rows = (
        db.query(Postulacion.estado, sa_func.count(Postulacion.id))
          .group_by(Postulacion.estado)
          .all()
    )

    res = {
        "nueva": 0,
        "destacada": 0,
        "posible": 0,
        "descartada": 0,
    }

    total = 0
    for estado, cnt in rows:
        total += int(cnt)
        key = (estado or "").strip().lower()
        if key in res:
            res[key] += int(cnt)
        # Otros estados no mapeados se ignoran en detalle, pero suman al total.

    res["total"] = total
    return res


@router.get("", dependencies=[Depends(admin_required)])
def list_postulaciones(
    q: str | None = Query(default=None),
    estado: str | None = Query(default=None),
    puesto_id: int | None = Query(default=None),
    unidad_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort: str = Query(default="reciente", pattern="^(reciente|antiguo|nombre_az|nombre_za|procesado)$"),
    db: Session = Depends(get_db),
):
    items, total = PostulacionesService(db).list(q, estado, puesto_id, unidad_id, limit, offset, sort)
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/{pid}", response_model=PostulacionOut, dependencies=[Depends(admin_required)])
def get_postulacion(pid: int, db: Session = Depends(get_db)):
    obj = PostulacionesService(db).get(pid)
    if not obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    return obj


# Crear (público): SIEMPRE estado="nueva"
@router.post("", response_model=PostulacionOut, status_code=status.HTTP_201_CREATED)
def create_postulacion(
    nombre: str = Form(...),
    apellido: str = Form(...),
    correo: str = Form(...),
    telefono: str | None = Form(None),
    puesto_id: int | None = Form(None),
    unidad_id: int | None = Form(None),
    nota: str | None = Form(None),
    cv: UploadFile = File(...),

    # --- Nuevos campos del postulante (opcionales) ---
    dni: str | None = Form(None),
    fecha_nacimiento: date | None = Form(None),
    estado_civil: str | None = Form(None),            # str libre, limitado en front
    hijos: bool | None = Form(None),
    domicilio_residencia: str | None = Form(None),
    localidad: str | None = Form(None),

    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    stored, size, mime = save_upload_file_cv(cv, nombre, apellido)
    svc = PostulacionesService(db)
    obj = svc.create_from_upload(
        nombre=nombre, apellido=apellido, correo=correo, telefono=telefono,
        puesto_id=puesto_id, unidad_id=unidad_id, nota=nota,
        cv_filename=stored, cv_original=cv.filename or "cv", cv_mime=mime, cv_size=size,
        # nuevos
        dni=dni,
        fecha_nacimiento=fecha_nacimiento,
        estado_civil=estado_civil,
        hijos=hijos,
        domicilio_residencia=domicilio_residencia,
        localidad=localidad,
    )

    # Datos amigables para el mail del admin
    unidad_nombre = None
    puesto_nombre = None
    if unidad_id:
        un = db.query(UnidadNegocio).filter(UnidadNegocio.id == unidad_id).first()
        unidad_nombre = un.nombre if un else None
    if puesto_id:
        pu = db.query(Puesto).filter(Puesto.id == puesto_id).first()
        puesto_nombre = pu.nombre if pu else None

    # Envío de correos
    subj_c, html_c, text_c = candidate_confirmation(obj.nombre, obj.apellido, obj.created_at)
    try:
        send_mail(subj_c, [obj.correo], html_c, text_c)
    except Exception as e:
        print(f"[MAIL_POSTULANTE_ERROR] id={obj.id} {e}")

    if ADMIN_EMAILS:
        subj_a, html_a, text_a = admin_new_cv(
            obj.id, obj.nombre, obj.apellido, obj.correo, obj.telefono,
            unidad_nombre, puesto_nombre, obj.created_at
        )
        try:
            send_mail(subj_a, ADMIN_EMAILS, html_a, text_a)
        except Exception as e:
            print(f"[MAIL_ADMIN_ERROR] id={obj.id} {e}")

    # BROADCAST create
    # Opcional: enviar el objeto completo o solo una señal para refetch
    # BROADCAST create
    # Opcional: enviar el objeto completo o solo una señal para refetch
    background_tasks.add_task(manager.broadcast, "POSTULACION_CREATED", {"id": obj.id, "estado": "nueva"})

    return obj


# DECIDIR (solo admin): estado libre (str), con motivo obligatorio
@router.post("/{pid}/decidir", response_model=PostulacionOut)
def decidir_postulacion(
    pid: int,
    payload: PostulacionDecisionIn,
    db: Session = Depends(get_db),
    jwt: dict = Depends(admin_required),  # contiene uid/role
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    reviewer_id = int(jwt.get("uid", 0) or 0)
    if not reviewer_id:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        obj = PostulacionesService(db).decide(
            pid, new_estado=payload.estado, motivo=payload.motivo, reviewer_user_id=reviewer_id
        )
        # BROADCAST update
        background_tasks.add_task(manager.broadcast, "POSTULACION_UPDATED", {"id": obj.id, "estado": obj.estado})
        
        return obj
    except ValueError as e:
        msg = str(e)
        if "No encontrado" in msg:
            raise HTTPException(status_code=404, detail=msg)
        # Cualquier otra validación (estado vacío/largo, motivo vacío) -> 400
        raise HTTPException(status_code=400, detail=msg)


# Update (no permite cambiar estado)
@router.patch("/{pid}", response_model=PostulacionOut, dependencies=[Depends(admin_required)])
def update_postulacion(pid: int, payload: PostulacionUpdate, db: Session = Depends(get_db), background_tasks: BackgroundTasks = BackgroundTasks()):
    try:
        obj = PostulacionesService(db).update(pid, payload)
        if not obj:
            raise HTTPException(status_code=404, detail="No encontrado")
        return obj
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # BROADCAST update
    background_tasks.add_task(manager.broadcast, "POSTULACION_UPDATED", {"id": obj.id, "estado": obj.estado})

    return obj


@router.delete("/{pid}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(admin_required)])
def delete_postulacion(pid: int, db: Session = Depends(get_db), background_tasks: BackgroundTasks = BackgroundTasks()):
    ok = PostulacionesService(db).delete(pid)
    if not ok:
        raise HTTPException(status_code=404, detail="No encontrado")
    
    # BROADCAST delete
    background_tasks.add_task(manager.broadcast, "POSTULACION_DELETED", {"id": pid})

    return


@router.get("/{pid}/cv/inline", dependencies=[Depends(admin_required)])
def view_cv_inline(pid: int, db: Session = Depends(get_db)):
    obj = PostulacionesService(db).get(pid)
    if not obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    path = cv_disk_path(obj.cv_filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Archivo CV no encontrado en el servidor")

    encoded_name = quote(obj.cv_original or "cv", safe="")
    resp = FileResponse(path, media_type=obj.cv_mime)
    # RFC 5987: soporta tildes, ñ y cualquier carácter Unicode
    resp.headers["Content-Disposition"] = f"inline; filename*=UTF-8''{encoded_name}"
    resp.headers["Cache-Control"] = "no-store"
    return resp


@router.get("/{pid}/cv/download", dependencies=[Depends(admin_required)])
def download_cv(pid: int, db: Session = Depends(get_db)):
    obj = PostulacionesService(db).get(pid)
    if not obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    path = cv_disk_path(obj.cv_filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Archivo CV no encontrado en el servidor")

    encoded_name = quote(obj.cv_original or "cv", safe="")
    resp = FileResponse(path, media_type=obj.cv_mime)
    # RFC 5987: soporta tildes, ñ y cualquier carácter Unicode
    resp.headers["Content-Disposition"] = f"attachment; filename*=UTF-8''{encoded_name}"
    resp.headers["Cache-Control"] = "no-store"
    return resp
