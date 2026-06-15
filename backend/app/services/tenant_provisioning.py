import secrets
import string

from sqlalchemy import select, func

from backend.app.database import AsyncSessionLocal
from backend.app.models.user import User

from backend.app.core.security import get_password_hash

from backend.app.models.tenant import Tenant


async def create_tenant(
    tenant_name: str,
    subdomain: str,
    admin_name: str,
    admin_email: str,
    admin_password: str,
    plan: str = "basic",
):
    async with AsyncSessionLocal() as db:

        # --------------------------------------------------
        # Check Tenant Exists
        # --------------------------------------------------

        existing_tenant = await db.execute(
            select(Tenant).where(
                Tenant.subdomain == subdomain
            )
        )

        if existing_tenant.scalar_one_or_none():
            raise ValueError(
                f"Tenant already exists: {subdomain}"
            )

        # --------------------------------------------------
        # Check User Exists
        # --------------------------------------------------

        existing_user = await db.execute(
            select(User).where(
                User.email == admin_email
            )
        )

        if existing_user.scalar_one_or_none():
            raise ValueError(
                f"Email already exists: {admin_email}"
            )

        # --------------------------------------------------
        # Create Tenant
        # --------------------------------------------------

        tenant = Tenant(
            name=tenant_name,
            subdomain=subdomain,
            plan=plan,
            is_active=True,
        )

        db.add(tenant)

        await db.flush()

        # --------------------------------------------------
        # Create Admin User
        # --------------------------------------------------

        admin_user = User(
            tenant_id=tenant.id,
            name=admin_name,
            email=admin_email,
            password_hash=get_password_hash(
                admin_password
            ),
        )

        db.add(admin_user)

        await db.commit()

        await db.refresh(tenant)
        await db.refresh(admin_user)

        return {
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.name,
            "subdomain": tenant.subdomain,
            "plan": tenant.plan,
            "admin_email": admin_user.email,
            "admin_user_id": str(admin_user.id),
        }

def generate_password(length: int = 12):
    alphabet = (
        string.ascii_letters +
        string.digits +
        "@#$%!"
    )

    return "".join(
        secrets.choice(alphabet)
        for _ in range(length)
    )


async def reset_tenant_password(
    email: str,
    new_password: str | None = None,
):
    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(User)
            .where(User.email == email)
        )

        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(
                f"User not found: {email}"
            )

        tenant_result = await db.execute(
            select(Tenant)
            .where(
                Tenant.id == user.tenant_id
            )
        )

        tenant = tenant_result.scalar_one()

        if not new_password:
            new_password = generate_password()

        user.password_hash = get_password_hash(
            new_password
        )

        await db.commit()

        return {
            "email": user.email,
            "tenant_name": tenant.name,
            "new_password": new_password,
        }


async def deactivate_tenant(
    subdomain: str,
):
    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(Tenant)
            .where(
                Tenant.subdomain == subdomain
            )
        )

        tenant = result.scalar_one_or_none()

        if not tenant:
            raise ValueError(
                f"Tenant not found: {subdomain}"
            )

        if not tenant.is_active:
            return {
                "tenant_id": str(tenant.id),
                "tenant_name": tenant.name,
                "subdomain": tenant.subdomain,
            }

        tenant.is_active = False

        await db.commit()
        await db.refresh(tenant)

        return {
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.name,
            "subdomain": tenant.subdomain,
        }


async def list_tenants():
    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(Tenant)
            .order_by(Tenant.created_at.desc())
        )

        tenants = result.scalars().all()

        return [
            {
                "tenant_id": str(t.id),
                "name": t.name,
                "subdomain": t.subdomain,
                "plan": t.plan,
                "is_active": t.is_active,
                "created_at": (
                    t.created_at.strftime(
                        "%Y-%m-%d %H:%M"
                    )
                    if t.created_at
                    else "-"
                ),
            }
            for t in tenants
        ]


async def activate_tenant(
    subdomain: str,
):
    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(Tenant)
            .where(
                Tenant.subdomain == subdomain
            )
        )

        tenant = result.scalar_one_or_none()

        if not tenant:
            raise ValueError(
                f"Tenant not found: {subdomain}"
            )

        if tenant.is_active:
            return {
                "tenant_id": str(tenant.id),
                "tenant_name": tenant.name,
                "subdomain": tenant.subdomain,
            }

        tenant.is_active = True

        await db.commit()
        await db.refresh(tenant)

        return {
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.name,
            "subdomain": tenant.subdomain,
        }


async def delete_tenant(
    subdomain: str,
):
    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(Tenant)
            .where(
                Tenant.subdomain == subdomain
            )
        )

        tenant = result.scalar_one_or_none()

        if not tenant:
            raise ValueError(
                f"Tenant not found: {subdomain}"
            )

        tenant_info = {
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.name,
            "subdomain": tenant.subdomain,
        }

        await db.delete(tenant)

        await db.commit()

        return tenant_info


async def get_tenant_stats():
    async with AsyncSessionLocal() as db:

        # ---------------------------------------
        # Total Tenants
        # ---------------------------------------

        total_tenants = await db.scalar(
            select(func.count())
            .select_from(Tenant)
        )

        # ---------------------------------------
        # Active Tenants
        # ---------------------------------------

        active_tenants = await db.scalar(
            select(func.count())
            .select_from(Tenant)
            .where(Tenant.is_active.is_(True))
        )

        # ---------------------------------------
        # Inactive Tenants
        # ---------------------------------------

        inactive_tenants = await db.scalar(
            select(func.count())
            .select_from(Tenant)
            .where(Tenant.is_active.is_(False))
        )

        # ---------------------------------------
        # Total Users
        # ---------------------------------------

        total_users = await db.scalar(
            select(func.count())
            .select_from(User)
        )

        # ---------------------------------------
        # Plan Distribution
        # ---------------------------------------

        plan_result = await db.execute(
            select(
                Tenant.plan,
                func.count(Tenant.id)
            )
            .group_by(Tenant.plan)
        )

        plans = {
            plan: count
            for plan, count in plan_result.all()
        }

        avg_users = (
            total_users / total_tenants
            if total_tenants
            else 0
        )

        return {
            "total_tenants": total_tenants,
            "active_tenants": active_tenants,
            "inactive_tenants": inactive_tenants,
            "total_users": total_users,
            "avg_users_per_tenant": avg_users,
            "plans": plans,
        }


async def get_tenant_details(
    subdomain: str,
):
    async with AsyncSessionLocal() as db:

        tenant_result = await db.execute(
            select(Tenant)
            .where(
                Tenant.subdomain == subdomain
            )
        )

        tenant = tenant_result.scalar_one_or_none()

        if not tenant:
            raise ValueError(
                f"Tenant not found: {subdomain}"
            )

        # ------------------------------------
        # Users Count
        # ------------------------------------

        total_users = await db.scalar(
            select(func.count())
            .select_from(User)
            .where(
                User.tenant_id == tenant.id
            )
        )

        # ------------------------------------
        # Admin Users
        # ------------------------------------

        admin_result = await db.execute(
            select(User)
            .where(
                User.tenant_id == tenant.id
            )
        )

        users = admin_result.scalars().all()

        admins = [
            {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
            }
            for user in users
        ]

        return {
            "tenant_id": str(tenant.id),
            "name": tenant.name,
            "subdomain": tenant.subdomain,
            "plan": tenant.plan,
            "status": (
                "ACTIVE"
                if tenant.is_active
                else "INACTIVE"
            ),
            "created_at": tenant.created_at,
            "total_users": total_users,
            "admins": admins,
        }