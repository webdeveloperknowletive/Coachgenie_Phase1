# ai/database/models/ai_chat_sessions.py

from uuid import uuid4

from sqlalchemy import (
    Column,
    String,
    DateTime,
)

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.sql import func

from database.database import Base


class AIChatSession(Base):

    __tablename__ = "ai_chat_sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    session_name = Column(
        String(255),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )