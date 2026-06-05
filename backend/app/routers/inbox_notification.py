from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.inbox_notification import InboxNotificationOut
from app.services import inbox_notification as inbox_service

router = APIRouter(prefix="/notifications/inbox", tags=["Inbox Notifications"])


@router.get("")
async def get_inbox(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "admin")),
):
    notifs = await inbox_service.get_inbox(
        db,
        tenant_id=str(tenant.id),
        user_id=str(current_user.id),
    )
    return {
        "success": True,
        "data": [InboxNotificationOut.model_validate(n) for n in notifs],
        "unread": sum(1 for n in notifs if not n.is_read),
    }


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "admin")),
):
    notif = await inbox_service.mark_read(db, str(tenant.id), notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.commit()
    return {"success": True, "data": InboxNotificationOut.model_validate(notif)}


@router.post("/read-all")
async def mark_all_read(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "admin")),
):
    count = await inbox_service.mark_all_read(db, str(tenant.id), str(current_user.id))
    await db.commit()
    return {"success": True, "marked": count}