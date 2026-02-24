from pydantic import BaseModel, Field
from typing import Optional, List
from .puestos import PuestoOut

class UnidadNegocioBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=80)
    descripcion: Optional[str] = Field(default=None, max_length=255)
    activo: bool = True
    class Config: from_attributes = True

class UnidadNegocioCreate(UnidadNegocioBase): pass

class UnidadNegocioUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=80)
    descripcion: Optional[str] = Field(default=None, max_length=255)
    activo: Optional[bool] = None

class UnidadNegocioOut(UnidadNegocioBase):
    id: int

# El "full" incluye el array de puestos
class UnidadNegocioOutFull(UnidadNegocioOut):
    puestos: List[PuestoOut] = []
