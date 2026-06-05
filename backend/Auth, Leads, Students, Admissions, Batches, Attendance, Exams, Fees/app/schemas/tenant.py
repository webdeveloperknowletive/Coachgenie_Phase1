from pydantic import BaseModel
from typing import Any
import uuid


class TenantCreate(BaseModel):
    name: str
    subdomain: str
    plan: str = "basic"
    settings: dict[str, Any] | None = None


class TenantOut(BaseModel):
    id: uuid.UUID
    name: str
    subdomain: str
    plan: str
    is_active: bool

    class Config:
        from_attributes = True
