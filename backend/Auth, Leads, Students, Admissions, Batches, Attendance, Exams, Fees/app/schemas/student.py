from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid


class StudentCreate(BaseModel):
    enrollment_no: str
    first_name: str
    last_name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    school_name: Optional[str] = None
    current_class: Optional[str] = None
    target_exam: Optional[str] = None
    joined_at: Optional[str] = None


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    school_name: Optional[str] = None
    current_class: Optional[str] = None
    target_exam: Optional[str] = None
    is_active: Optional[bool] = None
    left_at: Optional[str] = None


class StudentOut(BaseModel):
    id: uuid.UUID
    enrollment_no: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    current_class: Optional[str] = None
    target_exam: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
