import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models.inbox_notification import InboxNotification


async def get_inbox(
    db: AsyncSession,
    tenant_id: str,
    user_id: str,
    limit: int = 30,
) -> list[InboxNotification]:
    """Return notifications for a specific user OR broadcast (user_id IS NULL)."""
    result = await db.execute(
        select(InboxNotification)
        .where(
            and_(
                InboxNotification.tenant_id == tenant_id,
                or_(
                    InboxNotification.user_id == user_id,
                    InboxNotification.user_id.is_(None),
                ),
            )
        )
        .order_by(InboxNotification.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def mark_read(
    db: AsyncSession,
    tenant_id: str,
    notification_id: str,
) -> InboxNotification | None:
    result = await db.execute(
        select(InboxNotification).where(
            and_(
                InboxNotification.id == notification_id,
                InboxNotification.tenant_id == tenant_id,
            )
        )
    )
    notif = result.scalar_one_or_none()
    if notif and not notif.is_read:
        notif.is_read  = True
        notif.read_at  = datetime.now(timezone.utc)
        await db.flush()
    return notif


async def mark_all_read(
    db: AsyncSession,
    tenant_id: str,
    user_id: str,
) -> int:
    """Mark all unread notifications for a user as read. Returns count updated."""
    result = await db.execute(
        select(InboxNotification).where(
            and_(
                InboxNotification.tenant_id == tenant_id,
                InboxNotification.is_read == False,
                or_(
                    InboxNotification.user_id == user_id,
                    InboxNotification.user_id.is_(None),
                ),
            )
        )
    )
    notifs = result.scalars().all()
    now = datetime.now(timezone.utc)
    for n in notifs:
        n.is_read = True
        n.read_at = now
    await db.flush()
    return len(notifs)


async def create_notification(
    db: AsyncSession,
    tenant_id: str,
    title: str,
    body: str | None = None,
    icon: str | None = None,
    link: str | None = None,
    user_id: str | None = None,   # None = broadcast to all staff
) -> InboxNotification:
    notif = InboxNotification(
        tenant_id=tenant_id,
        user_id=user_id,
        title=title,
        body=body,
        icon=icon,
        link=link,
    )
    db.add(notif)
    await db.flush()
    return notif