from fastapi import APIRouter, Depends, Query
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.admission import AdmissionCreate, AdmissionUpdate, AdmissionOut
from app.services import admission as admission_service

router = APIRouter(prefix="/admissions", tags=["Admissions"])

@router.get("/")
async def list_admissions(
    db: DB,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    result = await admission_service.get_admissions(db, str(tenant.id), page, limit, status)
    return {"success": True, **result}

@router.post("/", status_code=201)
async def create_admission(
    body: AdmissionCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    data = body.model_dump()
    if data.get("lead_id"):
        data["lead_id"] = str(data["lead_id"])
    admission = await admission_service.create_admission(db, str(tenant.id), data)
    return {"success": True, "data": AdmissionOut.model_validate(admission)}

@router.get("/{admission_id}")
async def get_admission(
    admission_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    admission = await admission_service.get_admission(db, str(tenant.id), admission_id)
    return {"success": True, "data": AdmissionOut.model_validate(admission)}

@router.patch("/{admission_id}")
async def update_admission(
    admission_id: str,
    body: AdmissionUpdate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    admission = await admission_service.update_admission(
        db, str(tenant.id), admission_id, data, str(current_user.id)
    )
    return {"success": True, "data": AdmissionOut.model_validate(admission)}
