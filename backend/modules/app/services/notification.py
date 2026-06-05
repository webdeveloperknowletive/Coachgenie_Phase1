import httpx
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.notification import NotificationTemplate, NotificationLog
from app.models.user import User
from app.utils.exceptions import NotFoundError
from app.config import settings


async def get_templates(db: AsyncSession, tenant_id: str) -> list:
    result = await db.execute(
        select(NotificationTemplate).where(
            and_(
                NotificationTemplate.tenant_id == tenant_id,
                NotificationTemplate.is_active == True
            )
        )
    )
    return result.scalars().all()


async def create_template(db: AsyncSession, tenant_id: str, data: dict) -> NotificationTemplate:
    template = NotificationTemplate(tenant_id=tenant_id, **data)
    db.add(template)
    await db.flush()
    return template


async def get_logs(db: AsyncSession, tenant_id: str) -> list:
    result = await db.execute(
        select(NotificationLog).where(
            NotificationLog.tenant_id == tenant_id
        ).order_by(NotificationLog.created_at.desc()).limit(100)
    )
    return result.scalars().all()


async def send_notifications(
    db: AsyncSession,
    tenant_id: str,
    template_id: str,
    recipient_ids: list,
    variables: dict | None
) -> list:
    # Get template
    tpl_result = await db.execute(
        select(NotificationTemplate).where(
            and_(
                NotificationTemplate.id == template_id,
                NotificationTemplate.tenant_id == tenant_id
            )
        )
    )
    template = tpl_result.scalar_one_or_none()
    if not template:
        raise NotFoundError("Template")

    logs = []
    for recipient_id in recipient_ids:
        user_result = await db.execute(
            select(User).where(User.id == recipient_id)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            continue

        # Render body with variables
        body = template.body
        subject = template.subject or ""
        if variables:
            for key, val in variables.items():
                body = body.replace(f"{{{{{key}}}}}", str(val))
                subject = subject.replace(f"{{{{{key}}}}}", str(val))

        # Determine recipient reference
        if template.channel == "email":
            recipient_ref = user.email or ""
        elif template.channel == "whatsapp":
            recipient_ref = user.phone or ""
        else:
            recipient_ref = str(user.id)

        log = NotificationLog(
            tenant_id=tenant_id,
            template_id=template_id,
            recipient_id=recipient_id,
            channel=template.channel,
            recipient_ref=recipient_ref,
            subject=subject,
            body=body,
            status="queued",
        )
        db.add(log)
        await db.flush()

        # Send notification
        try:
            if template.channel == "email" and recipient_ref:
                await _send_email(recipient_ref, subject, body)
                log.status = "sent"
                log.sent_at = datetime.now(timezone.utc)
            elif template.channel == "whatsapp" and recipient_ref:
                await _send_whatsapp(recipient_ref, body)
                log.status = "sent"
                log.sent_at = datetime.now(timezone.utc)
            else:
                log.status = "sent"
                log.sent_at = datetime.now(timezone.utc)
        except Exception as e:
            log.status = "failed"
            log.error_msg = str(e)

        logs.append(log)

    await db.flush()
    return logs


async def _send_email(to: str, subject: str, body: str):
    if not settings.SMTP_HOST:
        return  # Skip if not configured

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message.attach(MIMEText(body, "html"))

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )


async def _send_whatsapp(phone: str, message: str):
    if not settings.WHATSAPP_ACCESS_TOKEN:
        return  # Skip if not configured

    url = f"{settings.WHATSAPP_API_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message},
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
