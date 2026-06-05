from fastapi import APIRouter, Depends, Query
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.exam import ExamCreate, ExamUpdate, ExamOut, BulkResultRequest, ExamResultOut
from app.services import exam as exam_service

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.get("/")
async def list_exams(
    db: DB,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    batch_id: str | None = Query(None),
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "student")),
):
    result = await exam_service.get_exams(db, str(tenant.id), page, limit, batch_id)
    return {"success": True, **result}

@router.post("/", status_code=201)
async def create_exam(
    body: ExamCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    data = body.model_dump()
    if data.get("batch_id"): data["batch_id"] = str(data["batch_id"])
    if data.get("subject_id"): data["subject_id"] = str(data["subject_id"])
    exam = await exam_service.create_exam(db, str(tenant.id), str(current_user.id), data)
    return {"success": True, "data": ExamOut.model_validate(exam)}

@router.patch("/{exam_id}")
async def update_exam(
    exam_id: str,
    body: ExamUpdate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    exam = await exam_service.update_exam(db, str(tenant.id), exam_id, data)
    return {"success": True, "data": ExamOut.model_validate(exam)}

@router.post("/{exam_id}/results", status_code=201)
async def submit_results(
    exam_id: str,
    body: BulkResultRequest,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    results_data = [{"student_id": str(r.student_id), "marks_obtained": r.marks_obtained, "remarks": r.remarks} for r in body.results]
    results = await exam_service.submit_results(db, str(tenant.id), exam_id, results_data)
    return {"success": True, "data": [ExamResultOut.model_validate(r) for r in results]}

@router.get("/{exam_id}/results")
async def get_results(
    exam_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "student", "parent")),
):
    results = await exam_service.get_results(db, str(tenant.id), exam_id)
    return {"success": True, "data": [ExamResultOut.model_validate(r) for r in results]}
