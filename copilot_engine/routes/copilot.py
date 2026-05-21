from fastapi import (
    APIRouter,
    HTTPException,
)

from pydantic import BaseModel

router = APIRouter(
    prefix="/copilot",
    tags=["AI Copilot"],
)


# =========================================================
# REQUEST SCHEMA
# =========================================================

class ChatRequest(
    BaseModel
):

    user_id: str
    message: str


# =========================================================
# RESPONSE SCHEMA
# =========================================================

class ChatResponse(
    BaseModel
):

    success: bool
    response: str


# =========================================================
# CHAT ENDPOINT
# =========================================================

@router.post(
    "/chat",
    response_model=ChatResponse,
)
async def chat_with_copilot(
    payload: ChatRequest,
):

    """
    Main AI Copilot chat endpoint.
    """

    try:

        # =============================================
        # TEMP RESPONSE
        # Replace later with orchestrator
        # =============================================

        ai_response = (
            f"AI Response to: "
            f"{payload.message}"
        )

        return ChatResponse(
            success=True,
            response=ai_response,
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )