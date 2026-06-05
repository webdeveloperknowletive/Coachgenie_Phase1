import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.user import User
from app.models.otp import OTPCode
from app.utils.security import hash_password, verify_password
from app.utils.exceptions import (
    NotFoundError, BadRequestError, UnauthorizedError
)
from app.config import settings


def generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))


async def _send_otp_email(email: str, otp: str, purpose: str):
    """Send OTP via email — skips if SMTP not configured."""
    if not settings.SMTP_HOST:
        print(f"[DEV MODE] OTP for {email}: {otp}")
        return

    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        subject = "Password Reset OTP" if purpose == "password_reset" else "Email Verification OTP"
        body = f"""
        <h2>CoachingERP - {subject}</h2>
        <p>Your OTP is: <strong style="font-size:24px">{otp}</strong></p>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        """

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = settings.SMTP_FROM
        message["To"] = email
        message.attach(MIMEText(body, "html"))

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
    except Exception as e:
        print(f"Email send failed: {e}")


async def forgot_password(
    db: AsyncSession,
    tenant_id: str,
    email: str
) -> dict:
    # Check user exists
    result = await db.execute(
        select(User).where(
            and_(User.tenant_id == tenant_id, User.email == email)
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        # Don't reveal if email exists — return success anyway
        return {"message": "If this email exists, an OTP has been sent."}

    # Invalidate old OTPs
    old_otps = await db.execute(
        select(OTPCode).where(
            and_(
                OTPCode.tenant_id == tenant_id,
                OTPCode.email == email,
                OTPCode.purpose == "password_reset",
                OTPCode.is_used == False
            )
        )
    )
    for old_otp in old_otps.scalars().all():
        old_otp.is_used = True

    # Generate new OTP
    otp = generate_otp()
    otp_record = OTPCode(
        tenant_id=tenant_id,
        email=email,
        code=otp,
        purpose="password_reset",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    db.add(otp_record)
    await db.flush()

    # Send email
    await _send_otp_email(email, otp, "password_reset")

    return {
        "message": "If this email exists, an OTP has been sent.",
        "dev_otp": otp if not settings.SMTP_HOST else None
    }


async def verify_otp(
    db: AsyncSession,
    tenant_id: str,
    email: str,
    otp: str
) -> bool:
    result = await db.execute(
        select(OTPCode).where(
            and_(
                OTPCode.tenant_id == tenant_id,
                OTPCode.email == email,
                OTPCode.code == otp,
                OTPCode.purpose == "password_reset",
                OTPCode.is_used == False
            )
        )
    )
    otp_record = result.scalar_one_or_none()

    if not otp_record:
        raise BadRequestError("Invalid OTP.")

    if otp_record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise BadRequestError("OTP has expired. Please request a new one.")

    if otp_record.attempts >= 3:
        raise BadRequestError("Too many attempts. Please request a new OTP.")

    otp_record.attempts += 1
    await db.flush()
    return True


async def reset_password(
    db: AsyncSession,
    tenant_id: str,
    email: str,
    otp: str,
    new_password: str
) -> dict:
    # Validate password strength
    import re
    if len(new_password) < 8:
        raise BadRequestError("Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", new_password):
        raise BadRequestError("Password must contain uppercase letter.")
    if not re.search(r"[a-z]", new_password):
        raise BadRequestError("Password must contain lowercase letter.")
    if not re.search(r"\d", new_password):
        raise BadRequestError("Password must contain a digit.")
    if not re.search(r"[@$!%*?&]", new_password):
        raise BadRequestError("Password must contain special character.")

    # Verify OTP
    result = await db.execute(
        select(OTPCode).where(
            and_(
                OTPCode.tenant_id == tenant_id,
                OTPCode.email == email,
                OTPCode.code == otp,
                OTPCode.purpose == "password_reset",
                OTPCode.is_used == False
            )
        )
    )
    otp_record = result.scalar_one_or_none()

    if not otp_record:
        raise BadRequestError("Invalid OTP.")

    if otp_record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise BadRequestError("OTP has expired.")

    # Update password
    user_result = await db.execute(
        select(User).where(
            and_(User.tenant_id == tenant_id, User.email == email)
        )
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User")

    user.password_hash = hash_password(new_password)

    # Mark OTP as used
    otp_record.is_used = True
    await db.flush()

    return {"message": "Password reset successfully."}


async def change_password(
    db: AsyncSession,
    user_id: str,
    current_password: str,
    new_password: str
) -> dict:
    # Validate password strength
    import re
    if len(new_password) < 8:
        raise BadRequestError("Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", new_password):
        raise BadRequestError("Password must contain uppercase letter.")
    if not re.search(r"[a-z]", new_password):
        raise BadRequestError("Password must contain lowercase letter.")
    if not re.search(r"\d", new_password):
        raise BadRequestError("Password must contain a digit.")
    if not re.search(r"[@$!%*?&]", new_password):
        raise BadRequestError("Password must contain special character.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User")

    if not verify_password(current_password, user.password_hash):
        raise UnauthorizedError("Current password is incorrect.")

    if current_password == new_password:
        raise BadRequestError("New password must be different from current password.")

    user.password_hash = hash_password(new_password)
    await db.flush()

    return {"message": "Password changed successfully."}


async def update_profile(
    db: AsyncSession,
    user_id: str,
    data: dict
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User")

    for key, value in data.items():
        if value is not None:
            setattr(user, key, value)

    await db.flush()
    return user
