from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/")
async def placeholder():
    return {"success": True, "message": "AI module - coming in Phase 3"}
