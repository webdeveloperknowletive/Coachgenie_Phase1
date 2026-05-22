# from fastapi import (
#     APIRouter,
#     HTTPException,
# )

# from pydantic import (
#     BaseModel,
# )

# from copilot_engine.llm.providers.groq_client import (
#     generate_groq_response,
# )

# router = APIRouter(
#     prefix="/copilot",
#     tags=["AI Copilot"],
# )


# # =========================================================
# # REQUEST SCHEMA
# # =========================================================

# class ChatRequest(
#     BaseModel
# ):

#     session_id: str
#     tenant_id: str
#     user_id: str
#     message: str


# # =========================================================
# # RESPONSE SCHEMA
# # =========================================================

# class ChatResponse(
#     BaseModel
# ):

#     success: bool
#     response: str


# # =========================================================
# # CHAT ENDPOINT
# # =========================================================

# @router.post(
#     "/chat",
#     response_model=ChatResponse,
# )
# async def chat_with_copilot(
#     payload: ChatRequest,
# ):

#     """
#     Main AI Copilot endpoint.
#     """

#     try:

#         # =================================================
#         # CALL GROQ PROVIDER
#         # =================================================

#         ai_response = await generate_groq_response(
#             prompt=payload.message,
#         )

#         return ChatResponse(
#             success=True,
#             response=ai_response,
#         )

#     except Exception as e:

#         raise HTTPException(
#             status_code=500,
#             detail=str(e),
#         )
from fastapi import (
    APIRouter,
    HTTPException,
)

from pydantic import BaseModel

from copilot_engine.orchestrators.chat_orchestrators import (
    ChatOrchestrator,
)

from typing import Optional

router = APIRouter(
    prefix="/copilot",
    tags=["AI Copilot"],
)

orchestrator = ChatOrchestrator()

class ChatRequest(BaseModel):

    user_id: str

    message: str

    session_id: Optional[str] = None

    tenant_id: Optional[str] = None

    context: Optional[dict] = None


class ChatResponse(BaseModel):

    success: bool

    response: str

    type: Optional[str] = "chat"

    report_url: Optional[str] = None


@router.post(
    "/chat",
    response_model=ChatResponse,
)
async def chat_with_copilot(
    payload: ChatRequest,
):

    try:

        ai_response = (
            await orchestrator.generate_response(
                user_message=payload.message,
                context=payload.context,
            )
        )

        return ChatResponse(
            success=True,

            response=ai_response.get(
                "message",
                "No response generated.",
            ),

            type=ai_response.get(
                "type",
                "chat",
            ),

            report_url=ai_response.get(
                "report_url",
            ),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )