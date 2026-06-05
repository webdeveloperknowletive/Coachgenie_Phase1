from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Annotated

from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.utils.security import decode_access_token
from app.utils.exceptions import UnauthorizedError, ForbiddenError, TenantNotFoundError


async def get_tenant(
    db: AsyncSession = Depends(get_db),
    x_tenant_id: str | None = Header(default=None),
    x_tenant_subdomain: str | None = Header(default=None),
) -> Tenant:
    if not x_tenant_id and not x_tenant_subdomain:
        raise TenantNotFoundError()

    if x_tenant_id:
        result = await db.execute(
            select(Tenant).where(Tenant.id == x_tenant_id)
        )
    else:
        result = await db.execute(
            select(Tenant).where(Tenant.subdomain == x_tenant_subdomain)
        )

    tenant = result.scalar_one_or_none()
    if not tenant or not tenant.is_active:
        raise TenantNotFoundError()
    return tenant


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

    result = await db.execute(
        select(User).where(
            and_(
                User.id == payload["sub"],
                User.tenant_id == str(tenant.id)
            )
        )
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive.")
    return user


def require_roles(*roles: str):
    async def checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role not in roles:
            raise ForbiddenError(
                f"Required roles: {roles}. Your role: {current_user.role}"
            )
        return current_user
    return checker


# Shortcut type annotations
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentTenant = Annotated[Tenant, Depends(get_tenant)]
DB = Annotated[AsyncSession, Depends(get_db)]
