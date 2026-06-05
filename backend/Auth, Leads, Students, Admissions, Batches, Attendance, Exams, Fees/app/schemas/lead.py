from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid


class LeadCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    source: str = "website"
    interested_course: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None


class LeadUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    interested_course: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None


class LeadOut(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: str
    email: Optional[str] = None
    source: str
    status: str
    interested_course: Optional[str] = None
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ActivityCreate(BaseModel):
    type: str
    description: str


class ActivityOut(BaseModel):
    id: uuid.UUID
    type: str
    description: str

    class Config:
        from_attributes = True
