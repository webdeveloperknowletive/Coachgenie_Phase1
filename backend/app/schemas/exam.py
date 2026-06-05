from pydantic import BaseModel
from typing import Optional, List
import uuid


class ExamCreate(BaseModel):
    batch_id: Optional[uuid.UUID] = None
    subject_id: Optional[uuid.UUID] = None
    title: str
    type: str = "unit_test"
    total_marks: float = 100
    passing_marks: float = 35
    duration_min: int = 60
    scheduled_at: Optional[str] = None
    instructions: Optional[str] = None


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    scheduled_at: Optional[str] = None
    instructions: Optional[str] = None
    is_published: Optional[bool] = None
    total_marks: Optional[float] = None
    passing_marks: Optional[float] = None


class ExamOut(BaseModel):
    id: uuid.UUID
    title: str
    type: str
    total_marks: float
    passing_marks: float
    duration_min: int
    scheduled_at: Optional[str] = None
    is_published: bool

    class Config:
        from_attributes = True


class ExamResultIn(BaseModel):
    student_id: uuid.UUID
    marks_obtained: float
    remarks: Optional[str] = None


class BulkResultRequest(BaseModel):
    results: List[ExamResultIn]


class ExamResultOut(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    marks_obtained: float
    grade: Optional[str] = None
    rank_in_batch: Optional[int] = None
    is_pass: bool
    remarks: Optional[str] = None

    class Config:
        from_attributes = True
