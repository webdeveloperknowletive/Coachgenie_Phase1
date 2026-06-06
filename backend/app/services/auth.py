import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.user import User, RefreshToken
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    hash_token, refresh_token_expiry
)
from app.utils.exceptions import UnauthorizedError, ConflictError
from app.schemas import user


async def register_user(db: AsyncSession, tenant_id: str, data: dict) -> User:
    result = await db.execute(
        select(User).where(
            and_(User.tenant_id == tenant_id, User.email == data["email"])
        )
    )
    if result.scalar_one_or_none():
        raise ConflictError("Email already registered.")

    user = User(
        tenant_id=tenant_id,
        email=data["email"],
        password_hash=hash_password(data["password"]),
        first_name=data["first_name"],
        last_name=data["last_name"],
        phone=data.get("phone"),
        role="student",
    )
    db.add(user)
    await db.flush()
    return user


async def login_user(db: AsyncSession, tenant_id: str, email: str, password: str) -> dict:
    result = await db.execute(
        select(User).where(
            and_(User.tenant_id == uuid.UUID(tenant_id), User.email == email)
        )
    )
    user = result.scalar_one_or_none()

    print("EMAIL:", user.email if user else None)
    print("PASSWORD HASH:", repr(user.password_hash) if user else None)
    print("HASH LENGTH:", len(user.password_hash) if user and user.password_hash else None)
    
    if not user or not user.is_active or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid credentials.")

    payload = {
        "sub": str(user.id),

        "tenantId": str(user.tenant_id),


        "tenant_id": str(user.tenant_id),
        "role": user.role,
        "email": user.email
    }
    access_token = create_access_token(payload)
    raw_refresh, hashed_refresh = create_refresh_token()

    token = RefreshToken(
        user_id=user.id,
        tenant_id=user.tenant_id,
        token_hash=hashed_refresh,
        expires_at=refresh_token_expiry(),
    )
    db.add(token)
    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()

    return {
        "access_token": access_token,
        "refresh_token": raw_refresh,
        "user": user,
    }


async def refresh_tokens(db: AsyncSession, raw_refresh: str) -> dict:
    token_hash = hash_token(raw_refresh)
    result = await db.execute(
        select(RefreshToken).where(
            and_(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False
            )
        )
    )
    token = result.scalar_one_or_none()

    if not token or token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise UnauthorizedError("Invalid or expired refresh token.")

    user_result = await db.execute(select(User).where(User.id == token.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive.")

    # Rotate token
    token.revoked = True
    payload = {
        "sub": str(user.id),

        "tenantId": str(user.tenant_id),


        "tenant_id": str(user.tenant_id),
        "role": user.role,
        "email": user.email
    }
    new_access = create_access_token(payload)
    new_raw, new_hash = create_refresh_token()

    new_token = RefreshToken(
        user_id=user.id,
        tenant_id=user.tenant_id,
        token_hash=new_hash,
        expires_at=refresh_token_expiry(),
    )
    db.add(new_token)
    await db.flush()

    return {"access_token": new_access, "refresh_token": new_raw}


async def logout_user(db: AsyncSession, raw_refresh: str):
    token_hash = hash_token(raw_refresh)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    token = result.scalar_one_or_none()
    if token:
        token.revoked = True
        await db.flush()
