from fastapi import APIRouter, Depends
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.attendance import TakeAttendanceRequest
from app.services import attendance as att_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/", status_code=201)
async def take_attendance(
    body: TakeAttendanceRequest,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
    db: DB = Depends(),
):
    records = []
    for r in body.records:
        records.append({
            "student_id": str(r.student_id),
            "status": r.status,
            "remarks": r.remarks,
        })
    session = await att_service.take_attendance(
        db, str(tenant.id), str(current_user.id),
        str(body.class_id), body.session_date, records
    )
    return {"success": True, "data": {"session_id": str(session.id)}}


@router.get("/class/{class_id}")
async def list_sessions(
    class_id: str,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor")),
    db: DB = Depends(),
):
    sessions = await att_service.get_sessions(db, str(tenant.id), class_id)
    return {
        "success": True,
        "data": [
            {"id": str(s.id), "session_date": str(s.session_date)}
            for s in sessions
        ]
    }


@router.get("/student/{student_id}/summary")
async def student_summary(
    student_id: str,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "parent", "student")),
    db: DB = Depends(),
):
    summary = await att_service.get_student_summary(db, str(tenant.id), student_id)
    return {"success": True, "data": summary}
