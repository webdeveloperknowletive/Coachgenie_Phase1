# ai/database/models/ai_chat_messages.py

from uuid import uuid4

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
)

from sqlalchemy.dialects.postgresql import (
    UUID,
    JSONB,
)

from sqlalchemy.sql import func

from database.database import Base


class AIChatMessage(Base):

    __tablename__ = "ai_chat_messages"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_chat_sessions.id"),
        nullable=False,
        index=True,
    )

    role = Column(
        String(50),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    metadata = Column(
        JSONB,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )