from sqlalchemy.orm import Session
from models.puestos import Puesto
from schemas.puestos import PuestoCreate, PuestoUpdate

class PuestosService:
    def __init__(self, db: Session): self.db = db

    def list(self, include_inactive: bool = True) -> list[Puesto]:
        q = self.db.query(Puesto)
        if not include_inactive: q = q.filter(Puesto.activo == True)
        return q.order_by(Puesto.nombre.asc()).all()

    def get(self, id: int) -> Puesto | None:
        return self.db.query(Puesto).filter(Puesto.id == id).first()

    def create(self, data: PuestoCreate) -> Puesto:
        obj = Puesto(**data.model_dump())
        self.db.add(obj); self.db.commit(); self.db.refresh(obj); return obj

    def update(self, id: int, data: PuestoUpdate) -> Puesto | None:
        obj = self.get(id); 
        if not obj: return None
        for k, v in data.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
        self.db.commit(); self.db.refresh(obj); return obj

    def delete(self, id: int) -> bool:
        obj = self.get(id)
        if not obj: return False
        self.db.delete(obj); self.db.commit(); return True
