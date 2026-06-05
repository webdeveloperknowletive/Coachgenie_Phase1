from fastapi import APIRouter, Depends, Query
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.growth_card import GrowthCardCreate, GrowthCardUpdate, GrowthCardOut
from app.services import growth_card as gc_service

router = APIRouter(prefix="/growth-cards", tags=["Growth Cards"])


@router.get("/")
async def list_growth_cards(
    db: DB,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor")),
):
    result = await gc_service.get_all_growth_cards(db, str(tenant.id), page, limit)
    return {"success": True, **result}


@router.post("/", status_code=201)
async def create_growth_card(
    body: GrowthCardCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    data = body.model_dump()
    data["student_id"] = str(data["student_id"])
    card = await gc_service.create_growth_card(
        db, str(tenant.id), str(current_user.id), data
    )
    return {"success": True, "data": GrowthCardOut.model_validate(card)}


@router.get("/student/{student_id}")
async def student_growth_cards(
    student_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "parent", "student")),
):
    cards = await gc_service.get_student_growth_cards(db, str(tenant.id), student_id)
    return {"success": True, "data": [GrowthCardOut.model_validate(c) for c in cards]}


@router.get("/{card_id}")
async def get_growth_card(
    card_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "counselor", "parent", "student")),
):
    card = await gc_service.get_growth_card(db, str(tenant.id), card_id)
    return {"success": True, "data": GrowthCardOut.model_validate(card)}


@router.patch("/{card_id}")
async def update_growth_card(
    card_id: str,
    body: GrowthCardUpdate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor", "parent")),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    card = await gc_service.update_growth_card(db, str(tenant.id), card_id, data)
    return {"success": True, "data": GrowthCardOut.model_validate(card)}
