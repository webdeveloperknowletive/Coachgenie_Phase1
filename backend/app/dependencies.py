# from fastapi import Depends, Header, Request
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select, and_
# from typing import Annotated

# from app.database import get_db
# from app.models.tenant import Tenant
# from app.models.user import User
# from app.utils.security import decode_access_token
# from app.utils.exceptions import UnauthorizedError, ForbiddenError, TenantNotFoundError
# import uuid


# async def get_tenant(
#     db: AsyncSession = Depends(get_db),
#     x_tenant_id: str | None = Header(default=None),
# ) -> Tenant:
   
#     if not x_tenant_id:
#         raise TenantNotFoundError("Tenant header missing")

#     query = None

#     # ✅ Detect if UUID
#     try:
#         uuid.UUID(x_tenant_id)
#         query = select(Tenant).where(Tenant.id == x_tenant_id)
#     except ValueError:
#         # ✅ fallback → treat as subdomain
#         query = select(Tenant).where(Tenant.subdomain == x_tenant_id)

#     result = await db.execute(query)
#     tenant = result.scalar_one_or_none()

#     if not tenant or not tenant.is_active:
#         raise TenantNotFoundError("Tenant not found or inactive")

#     return tenant


# async def get_current_user(
#     request: Request,
#     db: AsyncSession = Depends(get_db),
#     tenant: Tenant = Depends(get_tenant),
# ) -> User:
#     auth_header = request.headers.get("Authorization", "")
#     if not auth_header.startswith("Bearer "):
#         raise UnauthorizedError("No token provided.")

#     token = auth_header.split(" ")[1]
#     payload = decode_access_token(token)

#     result = await db.execute(
#         select(User).where(
#             and_(
#                 User.id == uuid.UUID(payload["sub"]),
#                 User.tenant_id == tenant.id
#             )
#         )
#     )
#     user = result.scalar_one_or_none()
#     if not user or not user.is_active:
#         raise UnauthorizedError("User not found or inactive.")
#     return user


# def require_roles(*roles: str):
#     async def checker(
#         current_user: User = Depends(get_current_user)
#     ) -> User:
#         if current_user.role not in roles:
#             raise ForbiddenError(
#                 f"Required roles: {roles}. Your role: {current_user.role}"
#             )
#         return current_user
#     return checker


# # ── Simple type aliases (NO default value) ───────────────────
# DB = Annotated[AsyncSession, Depends(get_db)]
# CurrentUser = Annotated[User, Depends(get_current_user)]
# CurrentTenant = Annotated[Tenant, Depends(get_tenant)]


from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Annotated

from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.utils.security import decode_access_token
from app.utils.exceptions import UnauthorizedError, ForbiddenError, TenantNotFoundError
import uuid


async def get_tenant(
    db: AsyncSession = Depends(get_db),
    x_tenant_subdomain: str | None = Header(default=None),  # ← matches "X-Tenant-Subdomain"
    x_tenant_id: str | None = Header(default=None),         # ← fallback for old header
) -> Tenant:
    """
    Accepts X-Tenant-Subdomain (primary) or X-Tenant-Id (fallback).
    Automatically detects UUID vs subdomain string.
    """

    # prefer X-Tenant-Subdomain, fall back to X-Tenant-Id
    raw = x_tenant_subdomain or x_tenant_id

    if not raw:
        raise TenantNotFoundError("X-Tenant-Subdomain header is missing")

    # detect if UUID → query by id, otherwise query by subdomain
    # detect if UUID ? query by id, otherwise query by subdomain
    try:
        uuid.UUID(raw)
        query = select(Tenant).where(Tenant.id == raw)
    except ValueError:
        query = select(Tenant).where(Tenant.subdomain == raw)

    result = await db.execute(query)
    tenant = result.scalar_one_or_none()

    if not tenant or not tenant.is_active:
        raise TenantNotFoundError(f"Tenant '{raw}' not found or inactive")

    return tenant


# async def get_current_user(
#     request: Request,
#     db: AsyncSession = Depends(get_db),
#     tenant: Tenant = Depends(get_tenant),
# ) -> User:
#     auth_header = request.headers.get("Authorization", "")
#     if not auth_header.startswith("Bearer "):
#         raise UnauthorizedError("No token provided.")

#     token = auth_header.split(" ")[1]
#     payload = decode_access_token(token)

#     result = await db.execute(
#         select(User).where(
#             and_(
#                 User.id == uuid.UUID(payload["sub"]),
#                 User.tenant_id == tenant.id,
#             )
#         )
#     )
#     user = result.scalar_one_or_none()
#     if not user or not user.is_active:
#         raise UnauthorizedError("User not found or inactive.")
#     return user
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> User:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise UnauthorizedError("No token provided.")

    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)

    # ✅ handle both camelCase and snake_case
    tenant_id = payload.get("tenant_id") or payload.get("tenantId")

    result = await db.execute(
        select(User).where(
            and_(
                User.id == uuid.UUID(payload["sub"]),
                User.tenant_id == tenant.id,
            )
        )
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive.")
    return user


def require_roles(*roles: str):
    async def checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in roles:
            raise ForbiddenError(
                f"Required roles: {roles}. Your role: {current_user.role}"
            )
        return current_user
    return checker


# ── Simple type aliases ───────────────────────────────────────
DB            = Annotated[AsyncSession, Depends(get_db)]
CurrentUser   = Annotated[User,         Depends(get_current_user)]
CurrentTenant = Annotated[Tenant,       Depends(get_tenant)]
# -- Simple type aliases ---------------------------------------
DB            = Annotated[AsyncSession, Depends(get_db)]
CurrentUser   = Annotated[User,         Depends(get_current_user)]
CurrentTenant = Annotated[Tenant,       Depends(get_tenant)]
