from fastapi import APIRouter, Depends
from sqlalchemy import select
from app.dependencies import DB
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantOut
from app.utils.exceptions import NotFoundError

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.post("/", response_model=TenantOut, status_code=201)
async def create_tenant(body: TenantCreate, db: DB = Depends()):
    tenant = Tenant(**body.model_dump())
    db.add(tenant)
    await db.flush()
    return tenant


@router.get("/{subdomain}", response_model=TenantOut)
async def get_tenant_by_subdomain(subdomain: str, db: DB = Depends()):
    result = await db.execute(select(Tenant).where(Tenant.subdomain == subdomain))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundError("Tenant")
    return tenant
