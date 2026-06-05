from pydantic import BaseModel
from typing import Any
import uuid


class TenantCreate(BaseModel):
    # name: str
    # subdomain: str
    # plan: str = "basic"
    # settings: dict[str, Any] | None = None
    name: str
    subdomain: str
    owner_email: str
    owner_password: str
    owner_first_name: str

class TenantOut(BaseModel):
    id: uuid.UUID
    name: str
    subdomain: str
    plan: str
    is_active: bool

    class Config:
        from_attributes = True
