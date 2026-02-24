# schemas/usuarios.py
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UsuarioBase(BaseModel):
    apellido: str = Field(min_length=2, max_length=50)
    nombre: str   = Field(min_length=2, max_length=50)
    correo: EmailStr
    role: str = "user"
    class Config:
        from_attributes = True

class UsuarioCreate(UsuarioBase):
    password: str = Field(min_length=8, max_length=128)

class UsuarioUpdate(BaseModel):
    apellido: Optional[str] = Field(default=None, min_length=2, max_length=50)
    nombre: Optional[str]   = Field(default=None, min_length=2, max_length=50)
    correo: Optional[EmailStr] = None
    role: Optional[str]     = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)

class UsuarioOut(UsuarioBase):
    id: int

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

# 👇 NUEVO: respuesta del login (token + datos de usuario + vencimiento)
class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UsuarioOut
    expires_at: datetime
    expires_in: int  # segundos
