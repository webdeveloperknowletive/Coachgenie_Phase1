# import hashlib
# import secrets
# from datetime import datetime, timedelta, timezone
# from jose import JWTError, jwt
# from passlib.context import CryptContext
# from app.config import settings
# from app.utils.exceptions import UnauthorizedError

# from jose import JWTError

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# def hash_password(password: str) -> str:
#     return pwd_context.hash(password[:72])

# # def verify_password(plain: str, hashed: str) -> bool:
# #     return pwd_context.verify(plain[:72], hashed)
# # def verify_password(plain: str, hashed: str) -> bool:
# #     print("HASH VALUE:", repr(hashed))
# #     print("HASH LENGTH:", len(hashed) if hashed else None)

# def verify_password(plain: str, hashed: str) -> bool:
#     print("=" * 80)
#     print("HASH TYPE:", type(hashed))
#     print("HASH VALUE:", repr(hashed))
#     print("HASH LENGTH:", len(hashed) if hashed else None)
#     print("=" * 80)

#     return pwd_context.verify(plain[:72], hashed)

#     return pwd_context.verify(plain[:72], hashed)



# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)


# def verify_password(plain: str, hashed: str) -> bool:
#     return pwd_context.verify(plain, hashed)


# def create_access_token(data: dict) -> str:
#     payload = data.copy()
#     expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
#     payload.update({"exp": expire, "type": "access"})
#     return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# def create_refresh_token() -> tuple[str, str]:
#     raw = secrets.token_hex(64)
#     hashed = hashlib.sha256(raw.encode()).hexdigest()
#     return raw, hashed


# def hash_token(raw: str) -> str:
#     return hashlib.sha256(raw.encode()).hexdigest()




# def hash_token(raw: str) -> str:
#     return hashlib.sha256(raw.encode()).hexdigest()


# def decode_access_token(token: str) -> dict:
#     try:
#         payload = jwt.decode(
#             token,
#             settings.SECRET_KEY,
#             algorithms=[settings.JWT_ALGORITHM]
#         )


#         print("JWT PAYLOAD:", payload)

#         if payload.get("type") != "access":
#             raise UnauthorizedError("Invalid token type.")

#         return payload

#     except JWTError as e:
#         print("JWT ERROR TYPE:", type(e).__name__)
#         print("JWT ERROR:", str(e))
#         raise UnauthorizedError("Invalid or expired token.")

# def refresh_token_expiry() -> datetime:
#     return datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


# def refresh_token_expiry() -> datetime:
#     return datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


# def refresh_token_expiry() -> datetime:
#     return datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
from app.utils.exceptions import UnauthorizedError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:72], hashed)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token() -> tuple[str, str]:
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
    except JWTError:
        raise UnauthorizedError("Invalid or expired token.")


def refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)