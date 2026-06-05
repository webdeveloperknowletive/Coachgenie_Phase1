from fastapi import APIRouter, Depends, Query
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.batch import (
    BatchCreate, BatchUpdate, BatchOut,
    SubjectCreate, SubjectOut,
    ClassCreate, ClassUpdate, ClassOut
)
from app.services import batch as batch_service

router = APIRouter(prefix="/batches", tags=["Batches"])


@router.get("/subjects")
async def list_subjects(
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor")),
    db: DB = Depends(),
):
    subjects = await batch_service.get_subjects(db, str(tenant.id))
    return {"success": True, "data": [SubjectOut.model_validate(s) for s in subjects]}


@router.post("/subjects", status_code=201)
async def create_subject(
    body: SubjectCreate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
    db: DB = Depends(),
):
    subject = await batch_service.create_subject(db, str(tenant.id), body.model_dump())
    return {"success": True, "data": SubjectOut.model_validate(subject)}


@router.get("/")
async def list_batches(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "tutor")),
    db: DB = Depends(),
):
    result = await batch_service.get_batches(db, str(tenant.id), page, limit)
    return {"success": True, **result}


@router.post("/", status_code=201)
async def create_batch(
    body: BatchCreate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
    db: DB = Depends(),
):
    batch = await batch_service.create_batch(db, str(tenant.id), body.model_dump())
    return {"success": True, "data": BatchOut.model_validate(batch)}


@router.patch("/{batch_id}")
async def update_batch(
    batch_id: str,
    body: BatchUpdate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
    db: DB = Depends(),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    batch = await batch_service.update_batch(db, str(tenant.id), batch_id, data)
    return {"success": True, "data": BatchOut.model_validate(batch)}


@router.post("/{batch_id}/enroll/{student_id}", status_code=201)
async def enroll_student(
    batch_id: str, student_id: str,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
    db: DB = Depends(),
):
    await batch_service.enroll_student(db, batch_id, student_id)
    return {"success": True, "message": "Student enrolled in batch."}


@router.delete("/{batch_id}/enroll/{student_id}")
async def remove_student(
    batch_id: str, student_id: str,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
    db: DB = Depends(),
):
    await batch_service.remove_student(db, batch_id, student_id)
    return {"success": True, "message": "Student removed from batch."}


@router.get("/{batch_id}/classes")
async def list_classes(
    batch_id: str,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "student")),
    db: DB = Depends(),
):
    classes = await batch_service.get_classes(db, str(tenant.id), batch_id)
    return {"success": True, "data": [ClassOut.model_validate(c) for c in classes]}


@router.post("/classes", status_code=201)
async def create_class(
    body: ClassCreate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
    db: DB = Depends(),
):
    data = body.model_dump()
    data["batch_id"] = str(data["batch_id"])
    if data.get("subject_id"):
        data["subject_id"] = str(data["subject_id"])
    if data.get("tutor_id"):
        data["tutor_id"] = str(data["tutor_id"])
    cls = await batch_service.create_class(db, str(tenant.id), data)
    return {"success": True, "data": ClassOut.model_validate(cls)}


@router.patch("/classes/{class_id}")
async def update_class(
    class_id: str,
    body: ClassUpdate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
    db: DB = Depends(),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    cls = await batch_service.update_class(db, str(tenant.id), class_id, data)
    return {"success": True, "data": ClassOut.model_validate(cls)}
