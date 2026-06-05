import uuid
from sqlalchemy import String, Boolean, Text, ForeignKey, text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from app.database import Base


class Admission(Base):
    __tablename__ = "admissions"
    __table_args__ = (
        UniqueConstraint("tenant_id", "admission_number", name="uq_admission_number"),
        Index("idx_admissions_tenant", "tenant_id"),
        Index("idx_admissions_status", "tenant_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    lead_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    admission_number: Mapped[str] = mapped_column(String(50), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    applied_course: Mapped[str] = mapped_column(String(150), nullable=False)
    documents_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    remarks: Mapped[str] = mapped_column(Text, nullable=True)
    approved_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"), onupdate=text("NOW()"))

    tenant = relationship("Tenant", back_populates="admissions")
