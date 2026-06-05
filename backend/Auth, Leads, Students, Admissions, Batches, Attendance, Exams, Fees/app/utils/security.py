import hashlib
import secrets
from datetime import datetime, timedelta, timezone
import jwt
from jwt.exceptions import PyJWTError
from passlib.context import CryptContext
from app.config import settings
from app.utils.exceptions import UnauthorizedError

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.BCRYPT_ROUNDS
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token() -> tuple[str, str]:
    """Returns (raw_token, hashed_token)"""
    raw = secrets.token_hex(64)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "access":
            raise UnauthorizedError("Invalid token type.")
        return payload
    except PyJWTError:
        raise UnauthorizedError("Invalid or expired token.")


def refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
