from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.admission import Admission
from app.utils.exceptions import NotFoundError, ConflictError
from app.utils.pagination import paginate


async def get_admissions(db: AsyncSession, tenant_id: str, page: int,
                         limit: int, status: str | None = None) -> dict:
    conditions = [Admission.tenant_id == tenant_id]
    if status:
        conditions.append(Admission.status == status)

    total = (await db.execute(
        select(func.count()).select_from(Admission).where(and_(*conditions))
    )).scalar()

    result = await db.execute(
        select(Admission).where(and_(*conditions))
        .order_by(Admission.created_at.desc())
        .offset((page - 1) * limit).limit(limit)
    )
    return paginate(result.scalars().all(), total, page, limit)


async def get_admission(db: AsyncSession, tenant_id: str, admission_id: str) -> Admission:
    result = await db.execute(
        select(Admission).where(
            and_(Admission.id == admission_id, Admission.tenant_id == tenant_id)
        )
    )
    admission = result.scalar_one_or_none()
    if not admission:
        raise NotFoundError("Admission")
    return admission


async def create_admission(db: AsyncSession, tenant_id: str, data: dict) -> Admission:
    existing = await db.execute(
        select(Admission).where(
            and_(
                Admission.tenant_id == tenant_id,
                Admission.admission_number == data["admission_number"]
            )
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("Admission number already exists.")

    admission = Admission(tenant_id=tenant_id, **data)
    db.add(admission)
    await db.flush()
    return admission


async def update_admission(db: AsyncSession, tenant_id: str, admission_id: str,
                           data: dict, approver_id: str | None = None) -> Admission:
    admission = await get_admission(db, tenant_id, admission_id)
    for key, value in data.items():
        if value is not None:
            setattr(admission, key, value)

    if data.get("status") == "approved" and approver_id:
        admission.approved_by = approver_id
        admission.approved_at = datetime.now(timezone.utc)

    await db.flush()
    return admission
