# request_context.py

from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class RequestContext(BaseModel):
    request_id: str
    user_id: UUID
    tenant_id: UUID
    session_id: Optional[str] = None