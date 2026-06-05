from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.growth_card import GrowthCard
from app.utils.exceptions import NotFoundError
from app.utils.pagination import paginate


async def get_student_growth_cards(
    db: AsyncSession,
    tenant_id: str,
    student_id: str
) -> list:
    result = await db.execute(
        select(GrowthCard).where(
            and_(
                GrowthCard.tenant_id == tenant_id,
                GrowthCard.student_id == student_id
            )
        ).order_by(GrowthCard.created_at.desc())
    )
    return result.scalars().all()


async def get_growth_card(
    db: AsyncSession,
    tenant_id: str,
    card_id: str
) -> GrowthCard:
    result = await db.execute(
        select(GrowthCard).where(
            and_(
                GrowthCard.id == card_id,
                GrowthCard.tenant_id == tenant_id
            )
        )
    )
    card = result.scalar_one_or_none()
    if not card:
        raise NotFoundError("Growth Card")
    return card


async def create_growth_card(
    db: AsyncSession,
    tenant_id: str,
    created_by: str,
    data: dict
) -> GrowthCard:
    card = GrowthCard(
        tenant_id=tenant_id,
        created_by=created_by,
        **data
    )
    db.add(card)
    await db.flush()
    return card


async def update_growth_card(
    db: AsyncSession,
    tenant_id: str,
    card_id: str,
    data: dict
) -> GrowthCard:
    card = await get_growth_card(db, tenant_id, card_id)
    for key, value in data.items():
        if value is not None:
            setattr(card, key, value)

    # If parent marked as seen
    if data.get("parent_seen") is True:
        card.parent_seen_at = datetime.now(timezone.utc)

    await db.flush()
    return card


async def get_all_growth_cards(
    db: AsyncSession,
    tenant_id: str,
    page: int,
    limit: int
) -> dict:
    conditions = [GrowthCard.tenant_id == tenant_id]
    total = (await db.execute(
        select(func.count()).select_from(GrowthCard).where(and_(*conditions))
    )).scalar()

    result = await db.execute(
        select(GrowthCard).where(and_(*conditions))
        .order_by(GrowthCard.created_at.desc())
        .offset((page - 1) * limit).limit(limit)
    )
    return paginate(result.scalars().all(), total, page, limit)
