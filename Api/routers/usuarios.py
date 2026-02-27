# routers/usuarios.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

from config.database import get_db
from middlewares.jwt_bearer import JWTBearer
from services.usuarios import UsuariosService
from schemas.usuarios import UsuarioCreate, UsuarioOut, UsuarioUpdate, UserLogin, AuthResponse
from utils.jwt_manager import create_token, ACCESS_TOKEN_EXPIRE_MINUTES
from utils.api_key import require_basic_or_api_key

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])  # deja tu prefix como lo tengasfrom utils.api_key import require_basic_or_api_key
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

@router.post("", response_model=UsuarioOut, dependencies=[Depends(JWTBearer())])
def create_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)):
    svc = UsuariosService(db)
    if svc.get_by_email(payload.correo):
        raise HTTPException(status_code=409, detail="El correo ya existe")
    user = svc.create(payload, hash_password(payload.password))
    return user

@router.get("", response_model=list[UsuarioOut], dependencies=[Depends(JWTBearer())])
def list_usuarios(db: Session = Depends(get_db)):
    return UsuariosService(db).list()

@router.get("/{user_id}", response_model=UsuarioOut, dependencies=[Depends(JWTBearer())])
def get_usuario(user_id: int, db: Session = Depends(get_db)):
    user = UsuariosService(db).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="No encontrado")
    return user

@router.patch("/{user_id}", response_model=UsuarioOut, dependencies=[Depends(JWTBearer())])
def update_usuario(user_id: int, payload: UsuarioUpdate, db: Session = Depends(get_db)):
    # 👇 FIX: Hash password if it is being updated
    if payload.password:
        payload.password = hash_password(payload.password)
        
    user = UsuariosService(db).update(user_id, payload)
    if not user:
        raise HTTPException(status_code=404, detail="No encontrado")
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(JWTBearer())])
def delete_usuario(user_id: int, db: Session = Depends(get_db)):
    ok = UsuariosService(db).delete(user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="No encontrado")
    return

# 👇 LOGIN: ahora devuelve token + user + expires
@router.post("/login", response_model=AuthResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    svc = UsuariosService(db)
    user = svc.get_by_email(data.email)
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_token(sub=user.correo, extra={"uid": user.id, "role": user.role})
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
        "expires_at": expires_at,                         # Pydantic lo serializa ISO 8601
        "expires_in": int(ACCESS_TOKEN_EXPIRE_MINUTES * 60),
    }

# (Opcional) /me para obtener el usuario actual desde el token
@router.get("/me", response_model=UsuarioOut)
def me(jwt: dict = Depends(JWTBearer()), db: Session = Depends(get_db)):
    uid = (jwt or {}).get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="No autenticado")
    user = UsuariosService(db).get(int(uid))
    if not user:
        raise HTTPException(status_code=404, detail="No encontrado")
    return user
