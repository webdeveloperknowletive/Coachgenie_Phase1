# from fastapi import APIRouter, Depends
# from sqlalchemy import select
# from app.dependencies import DB
# from app.models.tenant import Tenant
# from app.schemas.tenant import TenantCreate, TenantOut
# from app.utils.exceptions import NotFoundError
# from sqlalchemy.exc import IntegrityError


# router = APIRouter(prefix="/tenants", tags=["Tenants"])

# # commented this part ////////////////
# # @router.post("/", response_model=TenantOut, status_code=201)
# # async def create_tenant(body: TenantCreate, db: DB):
# #     tenant = Tenant(**body.model_dump())
# #     db.add(tenant)
# #     await db.flush()
# #     return tenant
# # ///////////////////////////////

# @router.post("/", response_model=TenantOut, status_code=201)
# async def create_tenant(body: TenantCreate, db: DB):

#     result = await db.execute(
#         select(Tenant).where(Tenant.subdomain == body.subdomain)
#     )
#     if result.scalar_one_or_none():
#         raise HTTPException(status_code=400, detail="Subdomain already exists")

#     tenant = Tenant(**body.model_dump())

#     try:
#         db.add(tenant)
#         await db.commit()
#         await db.refresh(tenant)

#     except IntegrityError:
#         await db.rollback()
#         raise HTTPException(status_code=400, detail="Subdomain already exists")

#     return tenant

# @router.get("/{subdomain}", response_model=TenantOut)
# async def get_tenant_by_subdomain(subdomain: str, db: DB):
#     result = await db.execute(select(Tenant).where(Tenant.subdomain == subdomain))
#     tenant = result.scalar_one_or_none()
#     if not tenant:
#         raise NotFoundError("Tenant")
#     return tenant

# from fastapi import HTTPException
# from sqlalchemy import select
# from sqlalchemy.exc import IntegrityError

# from app.models.user import User
# from app.utils.security import hash_password
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.dependencies import DB
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantCreate, TenantOut
from app.utils.security import hash_password



router = APIRouter(prefix="/tenants", tags=["Tenants"]) 

@router.post("/", response_model=TenantOut, status_code=201)
async def create_tenant(body: TenantCreate, db: DB):

    # ✅ 1. Check subdomain exists
    result = await db.execute(
        select(Tenant).where(Tenant.subdomain == body.subdomain)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Subdomain already exists")

    # ✅ 2. Create tenant
    tenant = Tenant(
        name=body.name,
        subdomain=body.subdomain
    )

    db.add(tenant)
    await db.flush()  # gets tenant.id

    try:
        # ✅ 3. Create admin user
        user = User(
            tenant_id=tenant.id,
            email=body.owner_email,
            password=hash_password(body.owner_password),
            first_name=body.owner_first_name,
            role="admin"
        )

        db.add(user)

        # ✅ 4. Commit everything
        await db.commit()
        await db.refresh(tenant)

    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Something went wrong")

    return tenant