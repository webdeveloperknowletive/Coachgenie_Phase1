from fastapi import APIRouter, Depends, Query
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.batch import (
    BatchCreate, BatchUpdate, BatchOut,
    SubjectCreate, SubjectOut,
    ClassCreate, ClassUpdate, ClassOut,
    SyllabusTopicCreate, SyllabusTopicUpdate, SyllabusTopicOut,
    SyllabusProgressUpdate, SyllabusTopicWithProgress,
)
from app.services import batch as batch_service

router = APIRouter(prefix="/batches", tags=["Batches"])

# ── Subjects ───────────────────────────────────────────────────

@router.get("/subjects")
async def list_subjects(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor")),
):
    subjects = await batch_service.get_subjects(db, str(tenant.id))
    return {"success": True, "data": [SubjectOut.model_validate(s) for s in subjects]}


@router.post("/subjects", status_code=201)
async def create_subject(
    body: SubjectCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
):
    subject = await batch_service.create_subject(db, str(tenant.id), body.model_dump())
    return {"success": True, "data": SubjectOut.model_validate(subject)}


# ── Syllabus Topics (on Subject) ───────────────────────────────

@router.get("/subjects/{subject_id}/syllabus")
async def get_syllabus_topics(
    subject_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "student")),
):
    topics = await batch_service.get_syllabus_topics(db, subject_id)
    return {"success": True, "data": [SyllabusTopicOut.model_validate(t) for t in topics]}


@router.post("/subjects/{subject_id}/syllabus", status_code=201)
async def create_syllabus_topic(
    subject_id: str,
    body: SyllabusTopicCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    data = body.model_dump()
    data["subject_id"] = subject_id
    topic = await batch_service.create_syllabus_topic(db, str(tenant.id), data)
    return {"success": True, "data": SyllabusTopicOut.model_validate(topic)}


@router.patch("/subjects/syllabus/{topic_id}")
async def update_syllabus_topic(
    topic_id: str,
    body: SyllabusTopicUpdate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    topic = await batch_service.update_syllabus_topic(db, topic_id, data)
    return {"success": True, "data": SyllabusTopicOut.model_validate(topic)}


@router.delete("/subjects/syllabus/{topic_id}")
async def delete_syllabus_topic(
    topic_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    await batch_service.delete_syllabus_topic(db, topic_id)
    return {"success": True, "message": "Topic deleted."}


# ── Batches ────────────────────────────────────────────────────

@router.get("/")
async def list_batches(
    db: DB,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "tutor")),
):
    result = await batch_service.get_batches(db, str(tenant.id), page, limit)
    return {"success": True, **result}


@router.post("/", status_code=201)
async def create_batch(
    body: BatchCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
):
    batch = await batch_service.create_batch(db, str(tenant.id), body.model_dump())
    return {"success": True, "data": BatchOut.model_validate(batch)}


@router.get("/by-student/{student_id}")
async def get_batches_for_student(
    student_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "tutor", "student")),
):
    """Return all batches a student is enrolled in."""
    batches = await batch_service.get_batches_for_student(db, str(tenant.id), student_id)
    return {"success": True, "data": [BatchOut.model_validate(b) for b in batches]}

@router.get("/{batch_id}")
async def get_batch(
    batch_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "tutor", "student")),
):
    batch = await batch_service.get_batch(db, str(tenant.id), batch_id)
    return {"success": True, "data": BatchOut.model_validate(batch)}


@router.patch("/{batch_id}")
async def update_batch(
    batch_id: str,
    body: BatchUpdate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    batch = await batch_service.update_batch(db, str(tenant.id), batch_id, data)
    return {"success": True, "data": BatchOut.model_validate(batch)}


# ── Enrollment ─────────────────────────────────────────────────

@router.post("/{batch_id}/enroll/{student_id}", status_code=201)
async def enroll_student(
    batch_id: str,
    student_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    await batch_service.enroll_student(db, batch_id, student_id)
    return {"success": True, "message": "Student enrolled."}


@router.delete("/{batch_id}/enroll/{student_id}")
async def remove_student(
    batch_id: str,
    student_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    await batch_service.remove_student(db, batch_id, student_id)
    return {"success": True, "message": "Student removed from batch."}


@router.get("/{batch_id}/students")
async def get_batch_students(
    batch_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "tutor", "student")),
):
    """Returns full student objects enrolled in this batch."""
    from app.schemas.student import StudentOut
    students = await batch_service.get_batch_students(db, str(tenant.id), batch_id)
    return {"success": True, "data": [StudentOut.model_validate(s) for s in students]}


# ── Syllabus Progress (per batch) ──────────────────────────────

@router.get("/{batch_id}/syllabus")
async def get_batch_syllabus(
    batch_id: str,
    subject_id: str = Query(..., description="Subject ID to get syllabus for"),
    db: DB = None,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "student")),
):
    """Get all syllabus topics for a subject with their completion status for this batch."""
    merged = await batch_service.get_syllabus_with_progress(
        db, str(tenant.id), batch_id, subject_id
    )
    return {"success": True, "data": merged}


@router.post("/{batch_id}/syllabus/{topic_id}/progress")
async def update_topic_progress(
    batch_id: str,
    topic_id: str,
    body: SyllabusProgressUpdate,
    db: DB = None,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    """Mark a syllabus topic as not_started / in_progress / completed for a batch."""
    prog = await batch_service.upsert_syllabus_progress(
        db, str(tenant.id), batch_id, topic_id, body.status, body.notes
    )
    return {"success": True, "data": {"id": str(prog.id), "status": prog.status}}


# ── Classes ────────────────────────────────────────────────────

@router.get("/{batch_id}/classes")
async def list_classes(
    batch_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "student")),
):
    classes = await batch_service.get_classes(db, str(tenant.id), batch_id)
    return {"success": True, "data": [ClassOut.model_validate(c) for c in classes]}


@router.post("/classes", status_code=201)
async def create_class(
    body: ClassCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    data = body.model_dump()
    data["batch_id"] = str(data["batch_id"])
    if data.get("subject_id"): data["subject_id"] = str(data["subject_id"])
    if data.get("tutor_id"):   data["tutor_id"]   = str(data["tutor_id"])
    cls = await batch_service.create_class(db, str(tenant.id), data)
    return {"success": True, "data": ClassOut.model_validate(cls)}


@router.patch("/classes/{class_id}")
async def update_class(
    class_id: str,
    body: ClassUpdate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    cls = await batch_service.update_class(db, str(tenant.id), class_id, data)
    return {"success": True, "data": ClassOut.model_validate(cls)}