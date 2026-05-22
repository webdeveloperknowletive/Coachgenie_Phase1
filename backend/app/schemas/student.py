import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
from pydantic import BaseModel, EmailStr, model_validator  # ← add model_validator
from typing import Optional, Any

class StudentCreate(BaseModel):
    enrollment_no: str
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
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
    subjects: list[str] = []
    batch_id: Optional[uuid.UUID] = None
    joined_at: Optional[date] = None


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth:  Optional[date] = None   # ← was Optional[str]
    # left_at:        Optional[date] = None   # ← was Optional[str]
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
    subjects: list[str] = []
    is_active: Optional[bool] = None
    # left_at: Optional[str] = None


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
    subjects: list[str] = []
    batch_ids: list[str] = []
    admission_id: Optional[uuid.UUID] = None
    is_active: bool

    @model_validator(mode="before")
    @classmethod
    def extract_batch_ids(cls, obj: Any) -> Any:
        # Only apply when validating from ORM object (not a dict)
        if hasattr(obj, "batch_enrollments"):
            enrollments = obj.batch_enrollments
            # Handle both loaded and unloaded relationships safely
            try:
                batch_ids = [str(e.batch_id) for e in (enrollments or [])]
            except Exception:
                batch_ids = []
            # Pydantic needs a dict to merge extra fields
            data = {
                "id":            obj.id,
                "enrollment_no": obj.enrollment_no,
                "first_name":    obj.first_name,
                "last_name":     obj.last_name,
                "email":         obj.email,
                "phone":         obj.phone,
                "gender":        obj.gender,
                "parent_name":   obj.parent_name,
                "parent_phone":  obj.parent_phone,
                "current_class": obj.current_class,
                "target_exam":   obj.target_exam,
                "subjects":      obj.subjects or [],
                "is_active":     obj.is_active,
                "admission_id":  obj.admission_id,
                "batch_ids":     batch_ids,  # ← populated from relationship
            }
            return data
        return obj

    class Config:
        from_attributes = True
