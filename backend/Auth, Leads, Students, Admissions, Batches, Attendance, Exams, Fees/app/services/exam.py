from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.exam import Exam, ExamResult
from app.utils.exceptions import NotFoundError, ConflictError
from app.utils.pagination import paginate


def calculate_grade(marks: float, total: float) -> str:
    pct = (marks / total) * 100
    if pct >= 90: return "A+"
    if pct >= 80: return "A"
    if pct >= 70: return "B+"
    if pct >= 60: return "B"
    if pct >= 50: return "C"
    if pct >= 35: return "D"
    return "F"


async def get_exams(db: AsyncSession, tenant_id: str, page: int,
                    limit: int, batch_id: str | None = None) -> dict:
    conditions = [Exam.tenant_id == tenant_id]
    if batch_id:
        conditions.append(Exam.batch_id == batch_id)

    total = (await db.execute(
        select(func.count()).select_from(Exam).where(and_(*conditions))
    )).scalar()

    result = await db.execute(
        select(Exam).where(and_(*conditions))
        .order_by(Exam.created_at.desc())
        .offset((page - 1) * limit).limit(limit)
    )
    return paginate(result.scalars().all(), total, page, limit)


async def get_exam(db: AsyncSession, tenant_id: str, exam_id: str) -> Exam:
    result = await db.execute(
        select(Exam).where(and_(Exam.id == exam_id, Exam.tenant_id == tenant_id))
    )
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam")
    return exam


async def create_exam(db: AsyncSession, tenant_id: str,
                      created_by: str, data: dict) -> Exam:
    exam = Exam(tenant_id=tenant_id, created_by=created_by, **data)
    db.add(exam)
    await db.flush()
    return exam


async def update_exam(db: AsyncSession, tenant_id: str,
                      exam_id: str, data: dict) -> Exam:
    exam = await get_exam(db, tenant_id, exam_id)
    for key, value in data.items():
        if value is not None:
            setattr(exam, key, value)
    await db.flush()
    return exam


async def submit_results(db: AsyncSession, tenant_id: str,
                         exam_id: str, results: list) -> list:
    exam = await get_exam(db, tenant_id, exam_id)
    created = []

    for r in results:
        existing = await db.execute(
            select(ExamResult).where(
                and_(
                    ExamResult.exam_id == exam_id,
                    ExamResult.student_id == r["student_id"]
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictError(f"Result already exists for student {r['student_id']}")

        is_pass = float(r["marks_obtained"]) >= float(exam.passing_marks)
        grade   = calculate_grade(float(r["marks_obtained"]), float(exam.total_marks))

        result_obj = ExamResult(
            tenant_id=tenant_id,
            exam_id=exam_id,
            student_id=r["student_id"],
            marks_obtained=r["marks_obtained"],
            grade=grade,
            is_pass=is_pass,
            remarks=r.get("remarks"),
        )
        db.add(result_obj)
        created.append(result_obj)

    await db.flush()

    # Assign ranks
    all_result = await db.execute(
        select(ExamResult).where(ExamResult.exam_id == exam_id)
        .order_by(ExamResult.marks_obtained.desc())
    )
    for rank, res in enumerate(all_result.scalars().all(), start=1):
        res.rank_in_batch = rank

    await db.flush()
    return created


async def get_results(db: AsyncSession, tenant_id: str, exam_id: str) -> list:
    result = await db.execute(
        select(ExamResult).where(
            and_(ExamResult.exam_id == exam_id, ExamResult.tenant_id == tenant_id)
        ).order_by(ExamResult.rank_in_batch.asc())
    )
    return result.scalars().all()
