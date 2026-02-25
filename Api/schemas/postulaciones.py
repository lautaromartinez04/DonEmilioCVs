from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, date

# -------------------------------------------------------------------
# Salimos de Enum/Literal: estado es un str libre.
# Mantengo compatibilidad Pydantic v1/v2 para validadores.
# -------------------------------------------------------------------
try:
    # Pydantic v2
    from pydantic import field_validator as _validator
    _V2 = True
except Exception:
    # Pydantic v1
    from pydantic import validator as _validator  # type: ignore
    _V2 = False


class PostulacionOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    correo: EmailStr
    telefono: Optional[str]
    puesto_id: Optional[int]
    unidad_id: Optional[int]
    puesto_original_id: Optional[int] = None
    unidad_original_id: Optional[int] = None
    created_at: datetime

    # Antes: Literal["nueva", "destacada", "posible", "descartada"]
    # Ahora: str libre (máx. 32 chars por consistencia con el modelo SQL)
    estado: str = Field(..., min_length=1, max_length=32)

    nota: Optional[str]
    cv_original: str
    cv_mime: str
    cv_size: int

    # --- Nuevos campos del postulante ---
    dni: Optional[str] = Field(default=None, max_length=20)
    fecha_nacimiento: Optional[date] = None
    estado_civil: Optional[str] = Field(default=None, max_length=20)  # sin enum
    hijos: Optional[bool] = None
    domicilio_residencia: Optional[str] = Field(default=None, max_length=200)
    localidad: Optional[str] = Field(default=None, max_length=120)

    # Campos de decisión
    decidido_motivo: Optional[str]
    decidido_por_user_id: Optional[int]
    decidido_en: Optional[datetime]  # ISO datetime

    class Config:
        # v1/v2 compat
        from_attributes = True

    # Normalizamos estado (trim)
    @_validator("estado")
    def _normalize_estado(cls, v: str) -> str:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("estado no puede estar vacío")
        return v


class PostulacionUpdate(BaseModel):
    # OJO: NO expongas 'estado' acá, se decide por endpoint aparte
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=60)
    apellido: Optional[str] = Field(default=None, min_length=2, max_length=60)
    correo: Optional[EmailStr] = None
    telefono: Optional[str] = None
    puesto_id: Optional[int] = None
    unidad_id: Optional[int] = None
    nota: Optional[str] = Field(default=None, max_length=255)

    # --- Nuevos campos (opcionales) ---
    dni: Optional[str] = Field(default=None, max_length=20)
    fecha_nacimiento: Optional[date] = None
    estado_civil: Optional[str] = Field(default=None, max_length=20)  # str libre
    hijos: Optional[bool] = None
    domicilio_residencia: Optional[str] = Field(default=None, max_length=200)
    localidad: Optional[str] = Field(default=None, max_length=120)


class PostulacionDecisionIn(BaseModel):
    # Antes: Literal["destacada", "posible", "descartada"]
    # Ahora: str libre (podés usar, por ejemplo: "contactada", "entrevista", etc.)
    estado: str = Field(..., min_length=1, max_length=32)
    motivo: str = Field(..., min_length=3, max_length=255)
    unidad_id: Optional[int] = None
    puesto_id: Optional[int] = None

    class Config:
        from_attributes = True

    @_validator("estado")
    def _normalize_estado(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("estado no puede estar vacío")
        return v
