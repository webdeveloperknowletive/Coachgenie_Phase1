import uuid
from sqlalchemy import String, Date, ForeignKey, text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from app.database import Base


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    __table_args__ = (
        UniqueConstraint("class_id", "session_date", name="uq_att_session"),
        Index("idx_att_sess_date", "tenant_id", "session_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    class_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    taken_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_date = mapped_column(Date, nullable=False)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    cls = relationship("Class", back_populates="attendance_sessions")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uq_att_record"),
        Index("idx_att_rec_student", "student_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="absent")
    remarks: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
