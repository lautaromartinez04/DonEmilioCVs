from sqlalchemy.orm import Session, selectinload
from models.unidades_negocio import UnidadNegocio
from schemas.unidades_negocio import UnidadNegocioCreate, UnidadNegocioUpdate

class UnidadesNegocioService:
    def __init__(self, db: Session): self.db = db

    # Lista con puestos embebidos
    def list_full(self, include_inactive: bool = True):
        q = self.db.query(UnidadNegocio).options(selectinload(UnidadNegocio.puestos))
        if not include_inactive:
            q = q.filter(UnidadNegocio.activo == True)
        return q.order_by(UnidadNegocio.nombre.asc()).all()

    # Una unidad con puestos embebidos
    def get_full(self, id: int):
        return (
            self.db.query(UnidadNegocio)
            .options(selectinload(UnidadNegocio.puestos))
            .filter(UnidadNegocio.id == id)
            .first()
        )

    # CRUD clásico
    def list(self, include_inactive: bool = True):
        q = self.db.query(UnidadNegocio)
        if not include_inactive:
            q = q.filter(UnidadNegocio.activo == True)
        return q.order_by(UnidadNegocio.nombre.asc()).all()

    def get(self, id: int):
        return self.db.query(UnidadNegocio).filter(UnidadNegocio.id == id).first()

    def create(self, data: UnidadNegocioCreate):
        obj = UnidadNegocio(**data.model_dump())
        self.db.add(obj); self.db.commit(); self.db.refresh(obj); return obj

    def update(self, id: int, data: UnidadNegocioUpdate):
        obj = self.get(id)
        if not obj: return None
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        self.db.commit(); self.db.refresh(obj); return obj

    def delete(self, id: int) -> bool:
        obj = self.get(id)
        if not obj: return False
        self.db.delete(obj); self.db.commit(); return True
