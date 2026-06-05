from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.batch import Batch, BatchStudent, Class, Subject
from app.utils.exceptions import NotFoundError, ConflictError
from app.utils.pagination import paginate


async def get_subjects(db: AsyncSession, tenant_id: str) -> list:
    result = await db.execute(
        select(Subject).where(Subject.tenant_id == tenant_id)
    )
    return result.scalars().all()


async def create_subject(db: AsyncSession, tenant_id: str, data: dict) -> Subject:
    subject = Subject(tenant_id=tenant_id, **data)
    db.add(subject)
    await db.flush()
    return subject


async def get_batches(db: AsyncSession, tenant_id: str, page: int, limit: int) -> dict:
    conditions = [Batch.tenant_id == tenant_id]
    total = (await db.execute(
        select(func.count()).select_from(Batch).where(and_(*conditions))
    )).scalar()

    result = await db.execute(
        select(Batch).where(and_(*conditions))
        .order_by(Batch.created_at.desc())
        .offset((page - 1) * limit).limit(limit)
    )
    return paginate(result.scalars().all(), total, page, limit)


async def get_batch(db: AsyncSession, tenant_id: str, batch_id: str) -> Batch:
    result = await db.execute(
        select(Batch).where(and_(Batch.id == batch_id, Batch.tenant_id == tenant_id))
    )
    batch = result.scalar_one_or_none()
    if not batch:
        raise NotFoundError("Batch")
    return batch


async def create_batch(db: AsyncSession, tenant_id: str, data: dict) -> Batch:
    batch = Batch(tenant_id=tenant_id, **data)
    db.add(batch)
    await db.flush()
    return batch


async def update_batch(db: AsyncSession, tenant_id: str,
                       batch_id: str, data: dict) -> Batch:
    batch = await get_batch(db, tenant_id, batch_id)
    for key, value in data.items():
        if value is not None:
            setattr(batch, key, value)
    await db.flush()
    return batch


async def enroll_student(db: AsyncSession, batch_id: str, student_id: str):
    existing = await db.execute(
        select(BatchStudent).where(
            and_(
                BatchStudent.batch_id == batch_id,
                BatchStudent.student_id == student_id
            )
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("Student already enrolled in this batch.")

    enrollment = BatchStudent(
        batch_id=batch_id,
        student_id=student_id,
        enrolled_at=date.today()
    )
    db.add(enrollment)
    await db.flush()


async def remove_student(db: AsyncSession, batch_id: str, student_id: str):
    result = await db.execute(
        select(BatchStudent).where(
            and_(
                BatchStudent.batch_id == batch_id,
                BatchStudent.student_id == student_id
            )
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise NotFoundError("Enrollment")
    await db.delete(enrollment)
    await db.flush()


async def get_classes(db: AsyncSession, tenant_id: str, batch_id: str) -> list:
    result = await db.execute(
        select(Class).where(
            and_(Class.batch_id == batch_id, Class.tenant_id == tenant_id)
        ).order_by(Class.scheduled_at.asc())
    )
    return result.scalars().all()


async def create_class(db: AsyncSession, tenant_id: str, data: dict) -> Class:
    cls = Class(tenant_id=tenant_id, **data)
    db.add(cls)
    await db.flush()
    return cls


async def update_class(db: AsyncSession, tenant_id: str,
                       class_id: str, data: dict) -> Class:
    result = await db.execute(
        select(Class).where(
            and_(Class.id == class_id, Class.tenant_id == tenant_id)
        )
    )
    cls = result.scalar_one_or_none()
    if not cls:
        raise NotFoundError("Class")
    for key, value in data.items():
        if value is not None:
            setattr(cls, key, value)
    await db.flush()
    return cls
