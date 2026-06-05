from fastapi import APIRouter

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
async def placeholder():
    return {"success": True, "message": "Notifications module - coming in Phase 3"}
