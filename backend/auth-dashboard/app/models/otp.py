import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from app.database import Base


class OTPCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(10), nullable=False)
    purpose: Mapped[str] = mapped_column(String(30), nullable=False, default="password_reset")
    is_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    expires_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
