from sqlalchemy import select

from backend.app.database import AsyncSessionLocal
from backend.app.models.user import User
from backend.app.models.tenant import Tenant

from backend.app.core.security import (
    get_password_hash
)


async def create_user(
    subdomain: str,
    name: str,
    email: str,
    password: str,
    role: str = "USER",
):
    async with AsyncSessionLocal() as db:

        tenant_result = await db.execute(
            select(Tenant).where(
                Tenant.subdomain == subdomain
            )
        )

        tenant = tenant_result.scalar_one_or_none()

        if not tenant:
            raise ValueError(
                f"Tenant not found: {subdomain}"
            )

        existing_user = await db.execute(
            select(User).where(
                User.email == email
            )
        )

        if existing_user.scalar_one_or_none():
            raise ValueError(
                f"Email already exists: {email}"
            )

        user = User(
            tenant_id=tenant.id,
            name=name,
            email=email,
            password_hash=get_password_hash(
                password
            ),
            role=role,
            is_active=True,
        )

        db.add(user)

        await db.commit()

        await db.refresh(user)

        return {
            "user_id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "tenant_name": tenant.name,
        }