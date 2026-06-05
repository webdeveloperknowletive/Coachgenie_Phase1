from fastapi import APIRouter, Depends, Query
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.notification import (
    TemplateCreate, TemplateOut,
    SendNotificationRequest, NotificationLogOut
)
from app.services import notification as notif_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/templates")
async def list_templates(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    templates = await notif_service.get_templates(db, str(tenant.id))
    return {"success": True, "data": [TemplateOut.model_validate(t) for t in templates]}


@router.post("/templates", status_code=201)
async def create_template(
    body: TemplateCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
):
    data = body.model_dump()
    template = await notif_service.create_template(db, str(tenant.id), data)
    return {"success": True, "data": TemplateOut.model_validate(template)}


@router.post("/send")
async def send_notifications(
    body: SendNotificationRequest,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    recipient_ids = [str(r) for r in body.recipient_ids]
    logs = await notif_service.send_notifications(
        db, str(tenant.id), str(body.template_id),
        recipient_ids, body.variables
    )
    return {
        "success": True,
        "data": [NotificationLogOut.model_validate(l) for l in logs],
        "sent": sum(1 for l in logs if l.status == "sent"),
        "failed": sum(1 for l in logs if l.status == "failed"),
        "total": len(logs),
    }


@router.get("/logs")
async def get_logs(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
):
    logs = await notif_service.get_logs(db, str(tenant.id))
    return {"success": True, "data": [NotificationLogOut.model_validate(l) for l in logs]}
