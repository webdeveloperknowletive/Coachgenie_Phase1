from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select, and_
from sqlalchemy import select, func, and_
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.utils.exceptions import ConflictError
from datetime import date
from app.models.batch import Class

async def get_heatmap(db: AsyncSession, tenant_id: str) -> dict:
    from app.models.attendance import AttendanceRecord
    from datetime import date, timedelta
    since = date.today() - timedelta(days=180)
    result = await db.execute(
        select(
            func.date(AttendanceRecord.created_at).label("day"),
            func.count(AttendanceRecord.id).label("sessions"),
        )
        .where(
            and_(
                AttendanceRecord.tenant_id == tenant_id,
                AttendanceRecord.status == "present",
                func.date(AttendanceRecord.created_at) >= since,
            )
        )
        .group_by("day")
    )
    return {str(r.day): min(r.sessions, 4) for r in result.all()}

async def get_attendance_by_batch(
    db: AsyncSession,
    tenant_id: str,
    batch_id: str,
    from_date: str,
    to_date: str,
) -> list:
    from datetime import date as date_type
    import uuid

    result = await db.execute(
        select(
            AttendanceRecord.student_id,
            AttendanceRecord.status,
            AttendanceSession.session_date,
        )
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .join(Class, AttendanceSession.class_id == Class.id)
        .where(
            and_(
                AttendanceSession.tenant_id == uuid.UUID(tenant_id),
                Class.batch_id == uuid.UUID(batch_id),
                AttendanceSession.session_date >= date_type.fromisoformat(from_date),
                AttendanceSession.session_date <= date_type.fromisoformat(to_date),
            )
        )
    )
    rows = result.all()

    # ✅ Deduplicate by student_id + date
    seen = set()
    unique_rows = []
    for r in rows:
        key = (str(r.student_id), str(r.session_date))
        if key not in seen:
            seen.add(key)
            unique_rows.append(r)

    return [
        {
            "studentId": str(r.student_id),
            "batchId":   batch_id,
            "date":      str(r.session_date),
            "status":    r.status,
        }
        for r in unique_rows
    ]


async def take_attendance(db: AsyncSession, tenant_id: str, taken_by: str,
                          class_id: str, session_date: date, records: list):  # ← str → date
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
