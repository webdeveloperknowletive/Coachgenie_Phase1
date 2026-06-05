import uuid
from sqlalchemy import String, Text, Integer, ForeignKey, text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from app.database import Base


class AISession(Base):
    __tablename__ = "ai_sessions"
    __table_args__ = (
        Index("idx_ai_sess_tenant", "tenant_id"),
        Index("idx_ai_sess_feature", "tenant_id", "feature"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    feature: Mapped[str] = mapped_column(String(50), nullable=False)
    started_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    ended_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    model_used: Mapped[str] = mapped_column(String(80), nullable=True)

    student = relationship("Student", back_populates="ai_sessions")
    messages = relationship("AIMessage", back_populates="session", cascade="all, delete-orphan")


class AIMessage(Base):
    __tablename__ = "ai_messages"
    __table_args__ = (
        Index("idx_ai_msg_session", "session_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_sessions.id", ondelete="CASCADE"), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tokens: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    session = relationship("AISession", back_populates="messages")


class DashboardSnapshot(Base):
    __tablename__ = "dashboard_snapshots"
    __table_args__ = (
        Index("idx_dash_tenant_role", "tenant_id", "role"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    data = mapped_column(Text, nullable=False)
    generated_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
