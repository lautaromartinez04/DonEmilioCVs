import os
from datetime import datetime, timedelta, timezone
from jwt import encode, decode, InvalidTokenError
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change_me")
ALGO = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

def create_token(sub: str, extra: dict | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": sub, "iat": now, "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}
    if extra:
        payload.update(extra)
    return encode(payload, key=SECRET_KEY, algorithm=ALGO)

def validate_token(token: str) -> dict:
    try:
        return decode(token, key=SECRET_KEY, algorithms=[ALGO])
    except InvalidTokenError as e:
        raise ValueError(str(e))
