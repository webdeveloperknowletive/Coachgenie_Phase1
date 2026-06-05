from fastapi import APIRouter, Depends, Query
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.exam import ExamCreate, ExamUpdate, ExamOut, BulkResultRequest, ExamResultOut
from app.services import exam as exam_service

router = APIRouter(prefix="/exams", tags=["Exams"])


@router.get("/")
async def list_exams(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    batch_id: str | None = Query(None),
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "student")),
    db: DB = Depends(),
):
    result = await exam_service.get_exams(db, str(tenant.id), page, limit, batch_id)
    return {"success": True, **result}


@router.post("/", status_code=201)
async def create_exam(
    body: ExamCreate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
    db: DB = Depends(),
):
    data = body.model_dump()
    if data.get("batch_id"):
        data["batch_id"] = str(data["batch_id"])
    if data.get("subject_id"):
        data["subject_id"] = str(data["subject_id"])
    exam = await exam_service.create_exam(db, str(tenant.id), str(current_user.id), data)
    return {"success": True, "data": ExamOut.model_validate(exam)}


@router.patch("/{exam_id}")
async def update_exam(
    exam_id: str,
    body: ExamUpdate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
    db: DB = Depends(),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    exam = await exam_service.update_exam(db, str(tenant.id), exam_id, data)
    return {"success": True, "data": ExamOut.model_validate(exam)}


@router.post("/{exam_id}/results", status_code=201)
async def submit_results(
    exam_id: str,
    body: BulkResultRequest,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
    db: DB = Depends(),
):
    results_data = []
    for r in body.results:
        d = r.model_dump()
        d["student_id"] = str(d["student_id"])
        results_data.append(d)
    results = await exam_service.submit_results(db, str(tenant.id), exam_id, results_data)
    return {"success": True, "data": [ExamResultOut.model_validate(r) for r in results]}


@router.get("/{exam_id}/results")
async def get_results(
    exam_id: str,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "student", "parent")),
    db: DB = Depends(),
):
    results = await exam_service.get_results(db, str(tenant.id), exam_id)
    return {"success": True, "data": [ExamResultOut.model_validate(r) for r in results]}
