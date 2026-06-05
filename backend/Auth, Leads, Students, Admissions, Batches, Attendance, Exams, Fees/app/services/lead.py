from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from app.models.lead import Lead, LeadActivity
from app.utils.exceptions import NotFoundError
from app.utils.pagination import paginate


async def get_leads(db: AsyncSession, tenant_id: str, page: int,
                    limit: int, status: str | None, search: str | None) -> dict:
    conditions = [Lead.tenant_id == tenant_id]
    if status:
        conditions.append(Lead.status == status)
    if search:
        conditions.append(
            or_(
                Lead.full_name.ilike(f"%{search}%"),
                Lead.phone.ilike(f"%{search}%"),
            )
        )
    total = (await db.execute(
        select(func.count()).select_from(Lead).where(and_(*conditions))
    )).scalar()

    result = await db.execute(
        select(Lead).where(and_(*conditions))
        .order_by(Lead.created_at.desc())
        .offset((page - 1) * limit).limit(limit)
    )
    return paginate(result.scalars().all(), total, page, limit)


async def get_lead(db: AsyncSession, tenant_id: str, lead_id: str) -> Lead:
    result = await db.execute(
        select(Lead).where(and_(Lead.id == lead_id, Lead.tenant_id == tenant_id))
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise NotFoundError("Lead")
    return lead


async def create_lead(db: AsyncSession, tenant_id: str, data: dict) -> Lead:
    lead = Lead(tenant_id=tenant_id, **data)
    db.add(lead)
    await db.flush()
    return lead


async def update_lead(db: AsyncSession, tenant_id: str, lead_id: str, data: dict) -> Lead:
    lead = await get_lead(db, tenant_id, lead_id)
    for key, value in data.items():
        if value is not None:
            setattr(lead, key, value)
    await db.flush()
    return lead


async def delete_lead(db: AsyncSession, tenant_id: str, lead_id: str):
    lead = await get_lead(db, tenant_id, lead_id)
    await db.delete(lead)
    await db.flush()


async def add_activity(db: AsyncSession, tenant_id: str, lead_id: str,
                       user_id: str, data: dict) -> LeadActivity:
    activity = LeadActivity(
        tenant_id=tenant_id,
        lead_id=lead_id,
        created_by=user_id,
        **data
    )
    db.add(activity)
    await db.flush()
    return activity


async def get_activities(db: AsyncSession, tenant_id: str, lead_id: str) -> list:
    result = await db.execute(
        select(LeadActivity).where(
            and_(
                LeadActivity.lead_id == lead_id,
                LeadActivity.tenant_id == tenant_id
            )
        ).order_by(LeadActivity.created_at.desc())
    )
    return result.scalars().all()
