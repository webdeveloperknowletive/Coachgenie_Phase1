from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.dependencies import get_tenant, require_roles, DB
from app.services import syllabus as syllabus_service

router = APIRouter(prefix="/syllabus", tags=["Syllabus"])


class TopicCreate(BaseModel):
    title: str
    subject: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = 0


class TopicToggle(BaseModel):
    completed: bool
    notes: Optional[str] = None


@router.get("/{batch_id}")
async def get_syllabus(
    batch_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "student", "parent")),
):
    data = await syllabus_service.get_syllabus(db, str(tenant.id), batch_id)
    return {"success": True, "data": data}


@router.post("/{batch_id}", status_code=201)
async def add_topic(
    batch_id: str,
    body: TopicCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    data = await syllabus_service.add_topic(db, str(tenant.id), batch_id, body.model_dump())
    await db.commit()
    return {"success": True, "data": data}


@router.patch("/{batch_id}/{item_id}/toggle")
async def toggle_topic(
    batch_id: str,
    item_id: str,
    body: TopicToggle,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    data = await syllabus_service.toggle_topic(
        db, str(tenant.id), batch_id, item_id, body.completed, body.notes
    )
    await db.commit()
    return {"success": True, "data": data}


@router.delete("/{batch_id}/{item_id}")
async def delete_topic(
    batch_id: str,
    item_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    await syllabus_service.delete_topic(db, str(tenant.id), batch_id, item_id)
    await db.commit()
    return {"success": True, "message": "Topic deleted"}