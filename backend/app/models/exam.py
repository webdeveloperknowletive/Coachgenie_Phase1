import uuid
from sqlalchemy import String, Boolean, Text, SmallInteger, Numeric, ForeignKey, text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from app.database import Base


class Exam(Base):
    __tablename__ = "exams"
    __table_args__ = (
        Index("idx_exams_tenant", "tenant_id"),
        Index("idx_exams_batch", "batch_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    batch_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="unit_test")
    total_marks: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=100)
    passing_marks: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=35)
    duration_min: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=60)
    scheduled_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    instructions: Mapped[str] = mapped_column(Text, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"), onupdate=text("NOW()"))

    tenant = relationship("Tenant", back_populates="exams")
    results = relationship("ExamResult", back_populates="exam", cascade="all, delete-orphan")


class ExamResult(Base):
    __tablename__ = "exam_results"
    __table_args__ = (
        UniqueConstraint("exam_id", "student_id", name="uq_exam_student"),
        Index("idx_er_exam_rank", "exam_id", "rank_in_batch"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    marks_obtained: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=0)
    grade: Mapped[str] = mapped_column(String(5), nullable=True)
    rank_in_batch: Mapped[int] = mapped_column(SmallInteger, nullable=True)
    is_pass: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    remarks: Mapped[str] = mapped_column(Text, nullable=True)
    submitted_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    exam = relationship("Exam", back_populates="results")
    student = relationship("Student", back_populates="exam_results")
