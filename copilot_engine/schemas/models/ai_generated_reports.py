# ai/database/models/ai_generated_reports.py

from uuid import uuid4

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
)

from sqlalchemy.dialects.postgresql import (
    UUID,
    JSONB,
)

from sqlalchemy.sql import func

from database.database import Base


class AIGeneratedReport(Base):

    __tablename__ = "ai_generated_reports"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    student_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    report_type = Column(
        String(100),
        nullable=False,
        index=True,
    )

    generated_by = Column(
        UUID(as_uuid=True),
        nullable=True,
    )

    summary = Column(
        Text,
        nullable=True,
    )

    report_json = Column(
        JSONB,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )