from backend.app.models.tenant import Tenant
from backend.app.models.user import User, RefreshToken
from backend.app.models.lead import Lead, LeadActivity
from backend.app.models.admission import Admission
from backend.app.models.student import Student
from backend.app.models.batch import Subject, Batch, BatchStudent, Class
from backend.app.models.attendance import AttendanceSession, AttendanceRecord
from backend.app.models.exam import Exam, ExamResult
from backend.app.models.fee import FeeStructure, FeeInvoice, FeePayment
from backend.app.models.syllabus import SyllabusItem, SyllabusProgress
from backend.app.models.growth_card import GrowthCard
from backend.app.models.notification import NotificationTemplate, NotificationLog
from backend.app.models.ai import AISession, AIMessage, DashboardSnapshot
from backend.app.models.otp import OTPCode

from backend.app.models.inbox_notification import InboxNotification

from backend.app.models.batch import Batch, BatchStudent, Class, Subject       # noqa: F401
 
# 2. Lead (depends on Tenant, User, Batch)
from backend.app.models.lead import Lead, LeadActivity                         # noqa: F401
 
# 3. Student (depends on Tenant, User, Batch via BatchStudent)
from backend.app.models.student import Student                                 # noqa: F401
 

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
