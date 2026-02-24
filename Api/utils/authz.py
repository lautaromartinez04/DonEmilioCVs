from fastapi import Depends, HTTPException, Request, status
from middlewares.jwt_bearer import JWTBearer

def admin_required(payload: dict = Depends(JWTBearer())):
    role = (payload or {}).get("role")
    if role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo administradores")
    return payload
