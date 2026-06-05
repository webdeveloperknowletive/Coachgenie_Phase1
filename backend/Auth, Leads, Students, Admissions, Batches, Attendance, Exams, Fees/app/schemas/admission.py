from pydantic import BaseModel
from typing import Optional
import uuid


class AdmissionCreate(BaseModel):
    lead_id: Optional[uuid.UUID] = None
    admission_number: str
    academic_year: str
    applied_course: str
    remarks: Optional[str] = None


class AdmissionUpdate(BaseModel):
    status: Optional[str] = None
    documents_verified: Optional[bool] = None
    remarks: Optional[str] = None
    applied_course: Optional[str] = None


class AdmissionOut(BaseModel):
    id: uuid.UUID
    admission_number: str
    academic_year: str
    applied_course: str
    status: str
    documents_verified: bool
    remarks: Optional[str] = None
    approved_at: Optional[str] = None

    class Config:
        from_attributes = True
