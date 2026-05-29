from app.models.tenant import Tenant
from app.models.user import User, RefreshToken
from app.models.lead import Lead, LeadActivity
from app.models.admission import Admission
from app.models.student import Student
from app.models.batch import Subject, Batch, BatchStudent, Class
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.exam import Exam, ExamResult
from app.models.fee import FeeStructure, FeeInvoice, FeePayment
from app.models.syllabus import SyllabusItem, SyllabusProgress
from app.models.growth_card import GrowthCard
from app.models.notification import NotificationTemplate, NotificationLog
from app.models.ai import AISession, AIMessage, DashboardSnapshot
from app.models.otp import OTPCode

from app.models.batch import Batch, BatchStudent, Class, Subject       # noqa: F401
 
# 2. Lead (depends on Tenant, User, Batch)
from app.models.lead import Lead, LeadActivity                         # noqa: F401
 
# 3. Student (depends on Tenant, User, Batch via BatchStudent)
from app.models.student import Student                                 # noqa: F401
 

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
    "OTPCode",
]
