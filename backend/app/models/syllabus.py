import uuid
from sqlalchemy import String, Text, SmallInteger, ForeignKey, text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from app.database import Base


class SyllabusItem(Base):
    __tablename__ = "syllabus_items"
    __table_args__ = (
        Index("idx_syllabus_subject", "subject_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    parent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("syllabus_items.id", ondelete="SET NULL"), nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    progress = relationship("SyllabusProgress", back_populates="topic", cascade="all, delete-orphan")


class SyllabusProgress(Base):
    __tablename__ = "syllabus_progress"
    __table_args__ = (
        UniqueConstraint("batch_id", "topic_id", name="uq_syllabus_progress"),
        Index("idx_syllabus_progress_batch", "batch_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    batch_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    topic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("syllabus_items.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="not_started")
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    completed_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    updated_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    batch = relationship("Batch", back_populates="syllabus_progress")
    topic = relationship("SyllabusItem", back_populates="progress")