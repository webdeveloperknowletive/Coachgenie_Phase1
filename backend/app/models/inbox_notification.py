import uuid
from sqlalchemy import String, Boolean, Text, ForeignKey, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from app.database import Base


class InboxNotification(Base):
    """In-app notifications shown in the admin topbar."""
    __tablename__ = "inbox_notifications"
    __table_args__ = (
        Index("idx_inbox_tenant", "tenant_id"),
        Index("idx_inbox_user",   "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Scope
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    # NULL = broadcast to all staff in tenant; set to specific user_id to target one person
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )

    # Content
    title:   Mapped[str] = mapped_column(String(255), nullable=False)
    body:    Mapped[str] = mapped_column(Text, nullable=True)
    icon:    Mapped[str] = mapped_column(String(50),  nullable=True)   # e.g. "lead", "fee", "admission"
    link:    Mapped[str] = mapped_column(String(500), nullable=True)   # frontend route to navigate to

    # State
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    read_at  = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))