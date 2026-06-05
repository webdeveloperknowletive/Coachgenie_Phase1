from pydantic import BaseModel
from typing import Optional, List
import uuid


class TemplateCreate(BaseModel):
    name: str
    channel: str  # whatsapp | email | push
    subject: Optional[str] = None
    body: str
    variables: Optional[List[str]] = None


class TemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    channel: str
    subject: Optional[str] = None
    body: str
    is_active: bool

    class Config:
        from_attributes = True


class SendNotificationRequest(BaseModel):
    template_id: uuid.UUID
    recipient_ids: List[uuid.UUID]
    variables: Optional[dict] = None


class NotificationLogOut(BaseModel):
    id: uuid.UUID
    channel: str
    recipient_ref: str
    status: str
    sent_at: Optional[str] = None
    error_msg: Optional[str] = None

    class Config:
        from_attributes = True
