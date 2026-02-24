from fastapi.security import HTTPBearer
from fastapi import Request, HTTPException
from utils.jwt_manager import validate_token

class JWTBearer(HTTPBearer):
    async def __call__(self, request: Request):
        auth = await super().__call__(request)
        try:
            payload = validate_token(auth.credentials)
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido o expirado")
        request.state.jwt_payload = payload
        return payload
