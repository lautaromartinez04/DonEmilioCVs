# utils/api_key.py
import os
import secrets
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials, APIKeyHeader

security_basic = HTTPBasic(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def _get_env_key_user():
    key = os.getenv("BASIC_API_KEY", "").strip()
    user = os.getenv("BASIC_API_USER", "apikey").strip()
    return key, user

async def require_basic_or_api_key(
    request: Request,
    credentials: HTTPBasicCredentials | None = Depends(security_basic),
    api_key: str | None = Depends(api_key_header),
):
    """Acepta EITHER:
       - Basic Auth:  username == BASIC_API_USER  AND  password == BASIC_API_KEY
       - Header:      X-API-Key: BASIC_API_KEY
    """
    expected_key, expected_user = _get_env_key_user()
    if not expected_key:
        # Si no hay key configurada, no habilitamos este guard
        raise HTTPException(status_code=500, detail="API key not configured")

    # Opción 1: X-API-Key header
    if api_key and secrets.compare_digest(api_key, expected_key):
        request.state.api_auth = {"mode": "header"}
        return True

    # Opción 2: HTTP Basic
    if credentials:
        user_ok = secrets.compare_digest(credentials.username, expected_user)
        pass_ok = secrets.compare_digest(credentials.password, expected_key)
        if user_ok and pass_ok:
            request.state.api_auth = {"mode": "basic", "user": credentials.username}
            return True

    # Si falla, devolvemos 401 con desafío Basic (para clientes humanos) y documentamos el header
    raise HTTPException(
        status_code=401,
        detail="Invalid API credentials",
        headers={"WWW-Authenticate": 'Basic realm="api"'}
    )

def require_public_api_key(api_key: str | None = Depends(api_key_header)):
    if api_key != "Donemilio@2026":
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return api_key
