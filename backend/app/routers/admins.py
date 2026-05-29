from fastapi import APIRouter, Depends
from sqlalchemy import select
from app.dependencies import get_tenant, require_roles, DB
from app.models.user import User

router = APIRouter(prefix="/admins", tags=["Admins"])

@router.get("/")
async def list_admins(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "admin")),
):
    result = await db.execute(
        select(User).where(User.tenant_id == str(tenant.id), User.role == "admin")
    )
    users = result.scalars().all()
    return {"success": True, "data": [
        {k: v for k, v in u.__dict__.items() if not k.startswith("_")}
        for u in users
    ]}