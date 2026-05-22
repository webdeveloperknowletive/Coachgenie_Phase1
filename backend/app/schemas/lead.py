# from pydantic import BaseModel, EmailStr
# from typing import Optional
# import uuid


# class LeadCreate(BaseModel):
#     full_name: str
#     phone: str
#     email: Optional[EmailStr] = None
#     parent_name: Optional[str] = None
#     parent_phone: Optional[str] = None
#     parent_contact_number: Optional[str] = None
#     school_name: Optional[str] = None
#     source: str = "website"
#     interested_course: Optional[str] = None
#     grade: Optional[str] = None
#     notes: Optional[str] = None
#     follow_up_date: Optional[str] = None
#     assigned_to: Optional[uuid.UUID] = None
#     # ── NEW ──────────────────────────────────────────────────────────────────
#     board_name: Optional[str] = None
#     batch_id: Optional[uuid.UUID] = None


# class LeadUpdate(BaseModel):
#     full_name: Optional[str] = None
#     phone: Optional[str] = None
#     email: Optional[EmailStr] = None
#     parent_name: Optional[str] = None
#     parent_phone: Optional[str] = None
#     parent_contact_number: Optional[str] = None
#     school_name: Optional[str] = None
#     source: Optional[str] = None
#     status: Optional[str] = None
#     interested_course: Optional[str] = None
#     grade: Optional[str] = None
#     notes: Optional[str] = None
#     follow_up_date: Optional[str] = None
#     assigned_to: Optional[uuid.UUID] = None
#     # ── NEW ──────────────────────────────────────────────────────────────────
#     board_name: Optional[str] = None
#     batch_id: Optional[uuid.UUID] = None


# class LeadOut(BaseModel):
#     id: uuid.UUID
#     full_name: str
#     phone: str
#     email: Optional[str] = None
#     parent_name: Optional[str] = None
#     parent_phone: Optional[str] = None
#     parent_contact_number: Optional[str] = None
#     school_name: Optional[str] = None
#     source: str
#     status: str
#     interested_course: Optional[str] = None
#     grade: Optional[str] = None
#     follow_up_date: Optional[str] = None
#     notes: Optional[str] = None
#     # ── NEW ──────────────────────────────────────────────────────────────────
#     board_name: Optional[str] = None
#     batch_id: Optional[uuid.UUID] = None
#     batch_name: Optional[str] = None          # resolved from the joined batch relationship

#     class Config:
#         from_attributes = True

#     # Resolve batch_name from the ORM relationship automatically
#     # @classmethod
#     # def model_validate(cls, obj, *args, **kwargs):
#     #     instance = super().model_validate(obj, *args, **kwargs)
#     #     # If the ORM object has a loaded batch relationship, copy its name
#     #     if hasattr(obj, "batch") and obj.batch is not None:
#     #         instance.batch_name = obj.batch.name
#     #     return instance


# class ActivityCreate(BaseModel):
#     type: str
#     description: str


# class ActivityOut(BaseModel):
#     id: uuid.UUID
#     type: str
#     description: str

#     class Config:
#         from_attributes = True

from pydantic import BaseModel, EmailStr
from typing import Optional, List
import uuid


class LeadCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_contact_number: Optional[str] = None
    school_name: Optional[str] = None
    source: str = "website"
    interested_course: Optional[str] = None
    grade: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    board_name: Optional[str] = None
    batch_id: Optional[uuid.UUID] = None
    subjects: Optional[List[str]] = []          # ← added


class LeadUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_contact_number: Optional[str] = None
    school_name: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    interested_course: Optional[str] = None
    grade: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    board_name: Optional[str] = None
    batch_id: Optional[uuid.UUID] = None
    subjects: Optional[List[str]] = None        # ← added


class LeadOut(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: str
    email: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_contact_number: Optional[str] = None
    school_name: Optional[str] = None
    source: str
    status: str
    interested_course: Optional[str] = None
    grade: Optional[str] = None
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None
    board_name: Optional[str] = None
    batch_id: Optional[uuid.UUID] = None
    batch_name: Optional[str] = None
    subjects: Optional[List[str]] = []          # ← added

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