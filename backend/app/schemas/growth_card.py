from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class GrowthCardCreate(BaseModel):
    student_id: uuid.UUID
    period_label: str
    academic_score: Optional[float] = None
    attendance_percent: Optional[float] = None
    behavior_rating: Optional[int] = None
    strengths: Optional[str] = None
    improvement_areas: Optional[str] = None
    tutor_remarks: Optional[str] = None


class GrowthCardUpdate(BaseModel):
    academic_score: Optional[float] = None
    attendance_percent: Optional[float] = None
    behavior_rating: Optional[int] = None
    strengths: Optional[str] = None
    improvement_areas: Optional[str] = None
    tutor_remarks: Optional[str] = None
    parent_seen: Optional[bool] = None


class GrowthCardOut(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    period_label: str
    academic_score: Optional[float] = None
    attendance_percent: Optional[float] = None
    behavior_rating: Optional[int] = None
    strengths: Optional[str] = None
    improvement_areas: Optional[str] = None
    tutor_remarks: Optional[str] = None
    parent_seen: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True