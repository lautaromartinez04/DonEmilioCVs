from sqlalchemy.orm import Session
from models.usuarios import Usuarios as UsuariosModel
from schemas.usuarios import UsuarioCreate, UsuarioUpdate

class UsuariosService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[UsuariosModel]:
        return self.db.query(UsuariosModel).all()

    def get(self, id: int) -> UsuariosModel | None:
        return self.db.query(UsuariosModel).filter(UsuariosModel.id == id).first()

    def get_by_email(self, correo: str) -> UsuariosModel | None:
        return self.db.query(UsuariosModel).filter(UsuariosModel.correo == correo).first()

    def create(self, data: UsuarioCreate, password_hash: str) -> UsuariosModel:
        obj = UsuariosModel(
            apellido=data.apellido,
            nombre=data.nombre,
            correo=data.correo,
            password=password_hash,
            role=data.role or "user",
        )
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, id: int, data: UsuarioUpdate) -> UsuariosModel | None:
        obj = self.get(id)
        if not obj:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, id: int) -> bool:
        obj = self.get(id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
