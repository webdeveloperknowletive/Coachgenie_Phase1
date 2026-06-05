import uuid
from sqlalchemy import String, Text, SmallInteger, ForeignKey, text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from app.database import Base


class SyllabusTopic(Base):
    __tablename__ = "syllabus_topics"
    __table_args__ = (
        Index("idx_syl_subject", "subject_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    parent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("syllabus_topics.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    children = relationship("SyllabusTopic", backref="parent", remote_side="SyllabusTopic.id")
    progress = relationship("SyllabusProgress", back_populates="topic", cascade="all, delete-orphan")


class SyllabusProgress(Base):
    __tablename__ = "syllabus_progress"
    __table_args__ = (
        UniqueConstraint("topic_id", "batch_id", name="uq_syl_prog"),
        Index("idx_sp_batch", "batch_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    topic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("syllabus_topics.id", ondelete="CASCADE"), nullable=False)
    batch_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    tutor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="not_started")
    completed_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"), onupdate=text("NOW()"))

    topic = relationship("SyllabusTopic", back_populates="progress")
    batch = relationship("Batch", back_populates="syllabus_progress")
