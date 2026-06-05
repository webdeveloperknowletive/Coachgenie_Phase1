import uuid
from sqlalchemy import String, Boolean, Text, SmallInteger, Numeric, ForeignKey, text, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from app.database import Base


class GrowthCard(Base):
    __tablename__ = "growth_cards"
    __table_args__ = (
        CheckConstraint("behavior_rating BETWEEN 1 AND 5", name="chk_behavior_rating"),
        Index("idx_gc_student", "student_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    period_label: Mapped[str] = mapped_column(String(50), nullable=False)
    academic_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)
    attendance_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)
    behavior_rating: Mapped[int] = mapped_column(SmallInteger, nullable=True)
    strengths: Mapped[str] = mapped_column(Text, nullable=True)
    improvement_areas: Mapped[str] = mapped_column(Text, nullable=True)
    tutor_remarks: Mapped[str] = mapped_column(Text, nullable=True)
    parent_seen: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    parent_seen_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"), onupdate=text("NOW()"))

    student = relationship("Student", back_populates="growth_cards")
