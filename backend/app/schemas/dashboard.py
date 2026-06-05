from pydantic import BaseModel
from typing import Optional


class OwnerDashboard(BaseModel):
    total_students: int
    active_batches: int
    total_leads: int
    converted_leads: int
    total_revenue: float
    pending_revenue: float
    total_exams: int
    avg_attendance_percent: float


class TutorDashboard(BaseModel):
    my_batches: int
    my_classes_today: int
    total_students: int
    exams_created: int
    avg_student_score: float


class StudentDashboard(BaseModel):
    my_batches: int
    attendance_percent: float
    total_exams: int
    avg_score: float
    pending_fees: float
    growth_cards: int


class ParentDashboard(BaseModel):
    child_name: str
    attendance_percent: float
    avg_score: float
    pending_fees: float
    latest_growth_card: Optional[str] = None


class CounselorDashboard(BaseModel):
    total_leads: int
    new_leads: int
    follow_up_leads: int
    converted_leads: int
    pending_admissions: int
