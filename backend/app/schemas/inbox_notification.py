from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class InboxNotificationOut(BaseModel):
    id:         uuid.UUID
    title:      str
    body:       Optional[str]   = None
    icon:       Optional[str]   = None
    link:       Optional[str]   = None
    is_read:    bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True