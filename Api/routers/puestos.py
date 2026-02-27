from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from config.database import get_db
from services.puestos import PuestosService
from schemas.puestos import PuestoCreate, PuestoUpdate, PuestoOut
from utils.authz import admin_required
from utils.api_key import require_public_api_key

router = APIRouter(prefix="/puestos", tags=["Puestos"])

@router.get("", response_model=list[PuestoOut], dependencies=[Depends(require_public_api_key)])  # público
def list_puestos(include_inactive: bool = Query(default=False), db: Session = Depends(get_db)):
    return PuestosService(db).list(include_inactive=include_inactive)

@router.post("", response_model=PuestoOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(admin_required)])
def create_puesto(payload: PuestoCreate, db: Session = Depends(get_db)):
    return PuestosService(db).create(payload)

@router.patch("/{pid}", response_model=PuestoOut, dependencies=[Depends(admin_required)])
def update_puesto(pid: int, payload: PuestoUpdate, db: Session = Depends(get_db)):
    obj = PuestosService(db).update(pid, payload)
    if not obj: raise HTTPException(status_code=404, detail="No encontrado")
    return obj

@router.delete("/{pid}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(admin_required)])
def delete_puesto(pid: int, db: Session = Depends(get_db)):
    ok = PuestosService(db).delete(pid)
    if not ok: raise HTTPException(status_code=404, detail="No encontrado")
    return
