from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from config.database import get_db
from services.unidades_negocio import UnidadesNegocioService
from schemas.unidades_negocio import (
    UnidadNegocioCreate, UnidadNegocioUpdate,
    UnidadNegocioOutFull
)
from utils.authz import admin_required
from utils.api_key import require_public_api_key

router = APIRouter(prefix="/unidades-negocio", tags=["Unidades de negocio"])

# LISTA con puestos embebidos (público)
@router.get("", response_model=list[UnidadNegocioOutFull], dependencies=[Depends(require_public_api_key)])
def list_unidades(include_inactive: bool = Query(default=False), db: Session = Depends(get_db)):
    return UnidadesNegocioService(db).list_full(include_inactive=include_inactive)

# GET por id con puestos embebidos (público)
@router.get("/{uid}", response_model=UnidadNegocioOutFull, dependencies=[Depends(require_public_api_key)])
def get_unidad(uid: int, db: Session = Depends(get_db)):
    obj = UnidadesNegocioService(db).get_full(uid)
    if not obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    return obj

# Admin CRUD
@router.post("", response_model=UnidadNegocioOutFull, status_code=status.HTTP_201_CREATED, dependencies=[Depends(admin_required)])
def create_unidad(payload: UnidadNegocioCreate, db: Session = Depends(get_db)):
    obj = UnidadesNegocioService(db).create(payload)
    # devolver con array vacío de puestos
    return UnidadesNegocioService(db).get_full(obj.id)

@router.patch("/{uid}", response_model=UnidadNegocioOutFull, dependencies=[Depends(admin_required)])
def update_unidad(uid: int, payload: UnidadNegocioUpdate, db: Session = Depends(get_db)):
    svc = UnidadesNegocioService(db)
    obj = svc.update(uid, payload)
    if not obj: raise HTTPException(status_code=404, detail="No encontrado")
    return svc.get_full(uid)

@router.delete("/{uid}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(admin_required)])
def delete_unidad(uid: int, db: Session = Depends(get_db)):
    ok = UnidadesNegocioService(db).delete(uid)
    if not ok: raise HTTPException(status_code=404, detail="No encontrado")
    return
