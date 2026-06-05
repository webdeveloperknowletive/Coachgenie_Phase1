from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, distinct
from app.models.student import Student
from app.models.batch import Batch, BatchStudent
from app.models.lead import Lead
from app.models.admission import Admission
from app.models.exam import Exam, ExamResult
from app.models.fee import FeeInvoice
from app.models.attendance import AttendanceRecord
from app.models.growth_card import GrowthCard
from app.models.user import User


async def get_owner_dashboard(db: AsyncSession, tenant_id: str) -> dict:
    # Total students
    total_students = (await db.execute(
        select(func.count()).select_from(Student).where(
            and_(Student.tenant_id == tenant_id, Student.is_active == True)
        )
    )).scalar()

    # Active batches
    active_batches = (await db.execute(
        select(func.count()).select_from(Batch).where(
            and_(Batch.tenant_id == tenant_id, Batch.is_active == True)
        )
    )).scalar()

    # Total leads
    total_leads = (await db.execute(
        select(func.count()).select_from(Lead).where(Lead.tenant_id == tenant_id)
    )).scalar()

    # Converted leads
    converted_leads = (await db.execute(
        select(func.count()).select_from(Lead).where(
            and_(Lead.tenant_id == tenant_id, Lead.status == "converted")
        )
    )).scalar()

    # Revenue
    revenue = (await db.execute(
        select(
            func.coalesce(func.sum(FeeInvoice.amount_due), 0).label("total"),
            func.coalesce(func.sum(FeeInvoice.amount_paid), 0).label("paid"),
        ).where(FeeInvoice.tenant_id == tenant_id)
    )).one()

    # Total exams
    total_exams = (await db.execute(
        select(func.count()).select_from(Exam).where(Exam.tenant_id == tenant_id)
    )).scalar()

    # Avg attendance
    att_result = (await db.execute(
        select(func.count()).select_from(AttendanceRecord).where(
            AttendanceRecord.tenant_id == tenant_id
        )
    )).scalar()

    present_count = (await db.execute(
        select(func.count()).select_from(AttendanceRecord).where(
            and_(
                AttendanceRecord.tenant_id == tenant_id,
                AttendanceRecord.status == "present"
            )
        )
    )).scalar()

    avg_attendance = round((present_count / att_result * 100), 2) if att_result > 0 else 0.0

    return {
        "total_students": total_students,
        "active_batches": active_batches,
        "total_leads": total_leads,
        "converted_leads": converted_leads,
        "total_revenue": float(revenue.total),
        "pending_revenue": float(revenue.total) - float(revenue.paid),
        "total_exams": total_exams,
        "avg_attendance_percent": avg_attendance,
    }


async def get_tutor_dashboard(db: AsyncSession, tenant_id: str, user_id: str) -> dict:
    from app.models.batch import Class
    from datetime import date

    # My classes today
    today = date.today()
    classes_today = (await db.execute(
        select(func.count()).select_from(Class).where(
            and_(
                Class.tenant_id == tenant_id,
                Class.tutor_id == user_id,
                func.date(Class.scheduled_at) == today
            )
        )
    )).scalar()

    # Exams created by tutor
    exams_created = (await db.execute(
        select(func.count()).select_from(Exam).where(
            and_(Exam.tenant_id == tenant_id, Exam.created_by == user_id)
        )
    )).scalar()

    # Avg student score in tutor's exams
    avg_score = (await db.execute(
        select(func.coalesce(func.avg(ExamResult.marks_obtained), 0)).where(
            ExamResult.tenant_id == tenant_id
        )
    )).scalar()

    return {
        "my_batches": 0,
        "my_classes_today": classes_today,
        "total_students": 0,
        "exams_created": exams_created,
        "avg_student_score": round(float(avg_score), 2),
    }


async def get_student_dashboard(db: AsyncSession, tenant_id: str, student_id: str) -> dict:
    # Attendance
    total_att = (await db.execute(
        select(func.count()).select_from(AttendanceRecord).where(
            and_(
                AttendanceRecord.tenant_id == tenant_id,
                AttendanceRecord.student_id == student_id
            )
        )
    )).scalar()

    present = (await db.execute(
        select(func.count()).select_from(AttendanceRecord).where(
            and_(
                AttendanceRecord.tenant_id == tenant_id,
                AttendanceRecord.student_id == student_id,
                AttendanceRecord.status == "present"
            )
        )
    )).scalar()

    att_pct = round((present / total_att * 100), 2) if total_att > 0 else 0.0

    # Exams
    total_exams = (await db.execute(
        select(func.count()).select_from(ExamResult).where(
            ExamResult.student_id == student_id
        )
    )).scalar()

    avg_score = (await db.execute(
        select(func.coalesce(func.avg(ExamResult.marks_obtained), 0)).where(
            ExamResult.student_id == student_id
        )
    )).scalar()

    # Pending fees
    pending = (await db.execute(
        select(
            func.coalesce(
                func.sum(FeeInvoice.amount_due - FeeInvoice.amount_paid), 0
            )
        ).where(
            and_(
                FeeInvoice.tenant_id == tenant_id,
                FeeInvoice.student_id == student_id,
                FeeInvoice.status.in_(["pending", "partial", "overdue"])
            )
        )
    )).scalar()

    # Batches
    batches = (await db.execute(
        select(func.count()).select_from(BatchStudent).where(
            BatchStudent.student_id == student_id
        )
    )).scalar()

    # Growth cards
    growth_cards = (await db.execute(
        select(func.count()).select_from(GrowthCard).where(
            and_(
                GrowthCard.tenant_id == tenant_id,
                GrowthCard.student_id == student_id
            )
        )
    )).scalar()

    return {
        "my_batches": batches,
        "attendance_percent": att_pct,
        "total_exams": total_exams,
        "avg_score": round(float(avg_score), 2),
        "pending_fees": float(pending),
        "growth_cards": growth_cards,
    }


async def get_counselor_dashboard(db: AsyncSession, tenant_id: str) -> dict:
    total_leads = (await db.execute(
        select(func.count()).select_from(Lead).where(Lead.tenant_id == tenant_id)
    )).scalar()

    new_leads = (await db.execute(
        select(func.count()).select_from(Lead).where(
            and_(Lead.tenant_id == tenant_id, Lead.status == "new")
        )
    )).scalar()

    follow_up = (await db.execute(
        select(func.count()).select_from(Lead).where(
            and_(Lead.tenant_id == tenant_id, Lead.status == "follow_up")
        )
    )).scalar()

    converted = (await db.execute(
        select(func.count()).select_from(Lead).where(
            and_(Lead.tenant_id == tenant_id, Lead.status == "converted")
        )
    )).scalar()

    pending_admissions = (await db.execute(
        select(func.count()).select_from(Admission).where(
            and_(
                Admission.tenant_id == tenant_id,
                Admission.status == "pending"
            )
        )
    )).scalar()

    return {
        "total_leads": total_leads,
        "new_leads": new_leads,
        "follow_up_leads": follow_up,
        "converted_leads": converted,
        "pending_admissions": pending_admissions,
    }
