from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.utils.exceptions import ConflictError


async def take_attendance(db: AsyncSession, tenant_id: str, taken_by: str,
                          class_id: str, session_date: str, records: list) -> AttendanceSession:
    existing = await db.execute(
        select(AttendanceSession).where(
            and_(
                AttendanceSession.class_id == class_id,
                AttendanceSession.session_date == session_date
            )
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("Attendance already taken for this class on this date.")

    session = AttendanceSession(
        tenant_id=tenant_id,
        class_id=class_id,
        taken_by=taken_by,
        session_date=session_date,
    )
    db.add(session)
    await db.flush()

    for record in records:
        att = AttendanceRecord(
            tenant_id=tenant_id,
            session_id=session.id,
            student_id=record["student_id"],
            status=record.get("status", "present"),
            remarks=record.get("remarks"),
        )
        db.add(att)

    await db.flush()
    return session


async def get_sessions(db: AsyncSession, tenant_id: str, class_id: str) -> list:
    result = await db.execute(
        select(AttendanceSession).where(
            and_(
                AttendanceSession.class_id == class_id,
                AttendanceSession.tenant_id == tenant_id
            )
        ).order_by(AttendanceSession.session_date.desc())
    )
    return result.scalars().all()


async def get_student_summary(db: AsyncSession, tenant_id: str, student_id: str) -> dict:
    result = await db.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.student_id == student_id,
                AttendanceRecord.tenant_id == tenant_id
            )
        )
    )
    records = result.scalars().all()
    total = len(records)

    if total == 0:
        return {
            "student_id": student_id,
            "total_classes": 0,
            "present": 0,
            "absent": 0,
            "late": 0,
            "attendance_percent": 0.0
        }

    present = sum(1 for r in records if r.status == "present")
    absent  = sum(1 for r in records if r.status == "absent")
    late    = sum(1 for r in records if r.status == "late")

    return {
        "student_id": student_id,
        "total_classes": total,
        "present": present,
        "absent": absent,
        "late": late,
        "attendance_percent": round((present / total) * 100, 2),
    }
