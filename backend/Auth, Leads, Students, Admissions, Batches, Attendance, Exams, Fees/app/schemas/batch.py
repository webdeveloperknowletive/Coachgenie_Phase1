from pydantic import BaseModel
from typing import Optional
import uuid


class SubjectCreate(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None


class SubjectOut(BaseModel):
    id: uuid.UUID
    name: str
    code: Optional[str] = None

    class Config:
        from_attributes = True


class BatchCreate(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    target_exam: Optional[str] = None
    academic_year: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    capacity: int = 50


class BatchUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_exam: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None
    end_date: Optional[str] = None


class BatchOut(BaseModel):
    id: uuid.UUID
    name: str
    code: Optional[str] = None
    target_exam: Optional[str] = None
    academic_year: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    capacity: int
    is_active: bool

    class Config:
        from_attributes = True


class ClassCreate(BaseModel):
    batch_id: uuid.UUID
    subject_id: Optional[uuid.UUID] = None
    tutor_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    scheduled_at: str
    duration_min: int = 60
    room_or_link: Optional[str] = None


class ClassUpdate(BaseModel):
    title: Optional[str] = None
    scheduled_at: Optional[str] = None
    duration_min: Optional[int] = None
    room_or_link: Optional[str] = None
    status: Optional[str] = None


class ClassOut(BaseModel):
    id: uuid.UUID
    title: str
    scheduled_at: str
    duration_min: int
    status: str
    room_or_link: Optional[str] = None

    class Config:
        from_attributes = True
