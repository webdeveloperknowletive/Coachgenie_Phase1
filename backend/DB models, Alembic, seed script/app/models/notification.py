import uuid
from sqlalchemy import String, Boolean, Text, ForeignKey, text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
from app.database import Base


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"
    __table_args__ = (
        UniqueConstraint("tenant_id", "name", "channel", name="uq_notif_tpl"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    variables = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    tenant = relationship("Tenant", back_populates="notification_templates")
    logs = relationship("NotificationLog", back_populates="template")


class NotificationLog(Base):
    __tablename__ = "notification_logs"
    __table_args__ = (
        Index("idx_nlog_tenant", "tenant_id"),
        Index("idx_nlog_status", "tenant_id", "status", "created_at"),
        Index("idx_nlog_recipient", "recipient_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("notification_templates.id", ondelete="SET NULL"), nullable=True)
    recipient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    recipient_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="queued")
    provider_ref: Mapped[str] = mapped_column(String(255), nullable=True)
    error_msg: Mapped[str] = mapped_column(Text, nullable=True)
    sent_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    delivered_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    read_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    template = relationship("NotificationTemplate", back_populates="logs")
