# Import all models here so Alembic can detect them automatically
from app.models.tenant import Tenant
from app.models.user import User, RefreshToken
from app.models.lead import Lead, LeadActivity
from app.models.admission import Admission
from app.models.student import Student
from app.models.batch import Subject, Batch, BatchStudent, Class
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.exam import Exam, ExamResult
from app.models.fee import FeeStructure, FeeInvoice, FeePayment
from app.models.syllabus import SyllabusTopic, SyllabusProgress
from app.models.growth_card import GrowthCard
from app.models.notification import NotificationTemplate, NotificationLog
from app.models.ai import AISession, AIMessage, DashboardSnapshot

__all__ = [
    "Tenant",
    "User", "RefreshToken",
    "Lead", "LeadActivity",
    "Admission",
    "Student",
    "Subject", "Batch", "BatchStudent", "Class",
    "AttendanceSession", "AttendanceRecord",
    "Exam", "ExamResult",
    "FeeStructure", "FeeInvoice", "FeePayment",
    "SyllabusTopic", "SyllabusProgress",
    "GrowthCard",
    "NotificationTemplate", "NotificationLog",
    "AISession", "AIMessage", "DashboardSnapshot",
]
