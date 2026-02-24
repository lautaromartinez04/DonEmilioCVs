from pydantic import BaseModel, Field
from typing import Optional

class PuestoBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=80)
    descripcion: Optional[str] = Field(default=None, max_length=255)
    activo: bool = True
    class Config: from_attributes = True

class PuestoCreate(PuestoBase):
    unidad_id: int

class PuestoUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=80)
    descripcion: Optional[str] = Field(default=None, max_length=255)
    activo: Optional[bool] = None
    unidad_id: Optional[int] = None

class PuestoOut(PuestoBase):
    id: int
    unidad_id: int
