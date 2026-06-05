from pydantic import BaseModel
from typing import Optional, List
import uuid


class AttendanceRecordIn(BaseModel):
    student_id: uuid.UUID
    status: str = "present"
    remarks: Optional[str] = None


class TakeAttendanceRequest(BaseModel):
    class_id: uuid.UUID
    session_date: str
    records: List[AttendanceRecordIn]


class AttendanceRecordOut(BaseModel):
    student_id: uuid.UUID
    status: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class StudentAttendanceSummary(BaseModel):
    student_id: str
    total_classes: int
    present: int
    absent: int
    late: int
    attendance_percent: float
