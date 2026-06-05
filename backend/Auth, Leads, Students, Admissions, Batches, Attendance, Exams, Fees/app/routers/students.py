from fastapi import APIRouter, Depends, Query
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.student import StudentCreate, StudentUpdate, StudentOut
from app.services import student as student_service

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/")
async def list_students(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "tutor")),
    db: DB = Depends(),
):
    result = await student_service.get_students(db, str(tenant.id), page, limit, search)
    return {"success": True, **result}


@router.post("/", status_code=201)
async def create_student(
    body: StudentCreate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
    db: DB = Depends(),
):
    student = await student_service.create_student(db, str(tenant.id), body.model_dump())
    return {"success": True, "data": StudentOut.model_validate(student)}


@router.get("/{student_id}")
async def get_student(
    student_id: str,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "tutor", "parent", "student")),
    db: DB = Depends(),
):
    student = await student_service.get_student(db, str(tenant.id), student_id)
    return {"success": True, "data": StudentOut.model_validate(student)}


@router.patch("/{student_id}")
async def update_student(
    student_id: str,
    body: StudentUpdate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
    db: DB = Depends(),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    student = await student_service.update_student(db, str(tenant.id), student_id, data)
    return {"success": True, "data": StudentOut.model_validate(student)}


@router.delete("/{student_id}")
async def deactivate_student(
    student_id: str,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
    db: DB = Depends(),
):
    await student_service.deactivate_student(db, str(tenant.id), student_id)
    return {"success": True, "message": "Student deactivated."}
