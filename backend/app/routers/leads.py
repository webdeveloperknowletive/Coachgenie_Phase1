from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.lead import LeadCreate, LeadUpdate, LeadOut, ActivityCreate, ActivityOut
from app.services import lead as lead_service
from app.services import admission as admission_service

router = APIRouter(prefix="/leads", tags=["Leads"])


# ── List / CRUD ────────────────────────────────────────────────────────────────
@router.get("/")
async def list_leads(
    db: DB,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    search: str | None = Query(None),
    batch_id: str | None = Query(None),
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    result = await lead_service.get_leads(
        db, str(tenant.id), page, limit, status, search, batch_id=batch_id,
    )
    return {"success": True, **result}


@router.post("/", status_code=201)
async def create_lead(
    body: LeadCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    data = body.model_dump()
    if data.get("assigned_to"):
        data["assigned_to"] = str(data["assigned_to"])
    if data.get("batch_id"):
        data["batch_id"] = str(data["batch_id"])
    lead = await lead_service.create_lead(db, str(tenant.id), data)
    return {"success": True, "data": LeadOut.model_validate(lead)}


@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    lead = await lead_service.get_lead(db, str(tenant.id), lead_id)
    return {"success": True, "data": LeadOut.model_validate(lead)}


@router.patch("/{lead_id}")
async def update_lead(
    lead_id: str,
    body: LeadUpdate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if data.get("batch_id"):
        data["batch_id"] = str(data["batch_id"])
    lead = await lead_service.update_lead(db, str(tenant.id), lead_id, data)
    return {"success": True, "data": LeadOut.model_validate(lead)}


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
):
    await lead_service.delete_lead(db, str(tenant.id), lead_id)
    return {"success": True, "message": "Lead deleted."}


# ── Pipeline actions ───────────────────────────────────────────────────────────

class AssignCounselorBody(BaseModel):
    counselor_id: str

@router.post("/{lead_id}/assign-counselor")
async def assign_counselor(
    lead_id: str,
    body: AssignCounselorBody,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    lead = await lead_service.update_lead(
        db, str(tenant.id), lead_id,
        {"assigned_to": body.counselor_id}
    )
    await db.commit()
    return {"success": True, "message": "Counselor assigned.", "data": LeadOut.model_validate(lead)}


class ChangeStageBody(BaseModel):
    stage: str  # new / contacted / interested / converted / lost

@router.post("/{lead_id}/change-stage")
async def change_stage(
    lead_id: str,
    body: ChangeStageBody,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    valid_stages = {"new", "contacted", "interested", "converted", "lost"}
    if body.stage not in valid_stages:
        raise HTTPException(status_code=422, detail=f"Invalid stage. Must be one of: {valid_stages}")
    lead = await lead_service.update_lead(
        db, str(tenant.id), lead_id, {"status": body.stage}
    )
    await db.commit()
    return {"success": True, "message": f"Stage updated to '{body.stage}'.", "data": LeadOut.model_validate(lead)}


class ScheduleFollowupBody(BaseModel):
    follow_up_date: date
    notes: Optional[str] = None

@router.post("/{lead_id}/schedule-followup")
async def schedule_followup(
    lead_id: str,
    body: ScheduleFollowupBody,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    lead = await lead_service.update_lead(
        db, str(tenant.id), lead_id,
        {"follow_up_date": body.follow_up_date}
    )
    if body.notes:
        await lead_service.add_activity(
            db, str(tenant.id), lead_id, str(current_user.id),
            {"type": "follow_up_scheduled", "description": body.notes}
        )
    await db.commit()
    return {"success": True, "message": "Follow-up scheduled.", "data": LeadOut.model_validate(lead)}


class ConvertLeadBody(BaseModel):
    applied_course: Optional[str] = None
    academic_year: Optional[str] = None
    remarks: Optional[str] = None

@router.post("/{lead_id}/convert", status_code=201)
async def convert_lead(
    lead_id: str,
    body: ConvertLeadBody,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    """
    Single conversion endpoint. Atomically:
      1. Creates admission from lead data
      2. Auto-approves it
      3. Generates a student record
      4. Marks lead as converted
    """
    try:
        admission, student = await admission_service.convert_lead(
            db,
            tenant_id    = str(tenant.id),
            lead_id      = lead_id,
            converted_by = str(current_user.id),
            admission_data = {k: v for k, v in body.model_dump().items() if v is not None},
        )
        await db.commit()
        return {
            "success": True,
            "message": "Lead converted successfully.",
            "data": {
                "admission_id":   str(admission.id),
                "admission_number": admission.admission_number,
                "student_id":     str(student.id),
                "enrollment_no":  student.enrollment_no,
            }
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ── Activities ─────────────────────────────────────────────────────────────────
@router.post("/{lead_id}/activities", status_code=201)
async def add_activity(
    lead_id: str,
    body: ActivityCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    activity = await lead_service.add_activity(
        db, str(tenant.id), lead_id, str(current_user.id), body.model_dump()
    )
    return {"success": True, "data": ActivityOut.model_validate(activity)}


@router.get("/{lead_id}/activities")
async def list_activities(
    lead_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    activities = await lead_service.get_activities(db, str(tenant.id), lead_id)
    return {"success": True, "data": [ActivityOut.model_validate(a) for a in activities]}