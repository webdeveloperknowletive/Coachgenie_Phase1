import uuid
from sqlalchemy import String, Boolean, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP
from app.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    subdomain: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    plan: Mapped[str] = mapped_column(String(20), nullable=False, default="basic")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    settings: Mapped[dict] = mapped_column(JSONB, nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
        onupdate=text("NOW()"),
    )

    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="tenant", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="tenant", cascade="all, delete-orphan")
    batches = relationship("Batch", back_populates="tenant", cascade="all, delete-orphan")
    admissions = relationship("Admission", back_populates="tenant", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="tenant", cascade="all, delete-orphan")
    fee_structures = relationship("FeeStructure", back_populates="tenant", cascade="all, delete-orphan")
    notification_templates = relationship("NotificationTemplate", back_populates="tenant", cascade="all, delete-orphan")
