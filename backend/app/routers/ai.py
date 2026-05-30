from fastapi import APIRouter, Depends
from app.dependencies import (
    get_tenant,
    get_current_user,
    require_roles,
    DB,
)
from app.schemas.ai import (
    StartSessionRequest, ChatRequest,
    ChatResponse, SessionOut, MessageOut
)
from app.services import ai as ai_service
from fastapi import APIRouter
from pydantic import BaseModel

import httpx


router = APIRouter(prefix="/ai", tags=["AI"])

COPILOT_URL = "http://localhost:8001"

class CopilotChatRequest(BaseModel):
    message: str
    context: str | None = None


@router.post("/copilot/chat")
async def copilot_chat(
    body: CopilotChatRequest,
    tenant=Depends(get_tenant),
    current_user=Depends(
        require_roles(
            "owner",
            "counselor",
            "tutor",
            "student",
            "parent",
        )
    ),
):

    try:

        async with httpx.AsyncClient(timeout=60.0) as client:

            response = await client.post(
                f"{COPILOT_URL}/copilot/chat",
                json={
                    "message": body.message,
                    "context": body.context,
                    "user_id": str(current_user.id),
                    "tenant_id": str(tenant.id),
                    "role": current_user.role,
                },
            )

        return response.json()

    except Exception:

        return {
            "success": False,
            "message": "AI service unavailable",
        }

@router.post("/sessions", status_code=201)
async def start_session(
    body: StartSessionRequest,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(get_current_user),
):
    restricted_features = {
    "institute_analytics": ["owner"],
}

    if body.feature in restricted_features:

        allowed_roles = restricted_features[body.feature]

        if current_user.role not in allowed_roles:

            return {
                "success": False,
                "message": "Access denied",
            }
    session = await ai_service.start_session(
        db,
        str(tenant.id),
        str(current_user.id),
        body.feature,
        str(body.student_id) if body.student_id else None
    )
    return {"success": True, "data": SessionOut.model_validate(session)}

@router.post("/sessions/{session_id}/chat")
async def chat(

    session_id: str,

    body: ChatRequest,

    db: DB,

    tenant=Depends(get_tenant),

    current_user=Depends(get_current_user),
):

    result = await ai_service.chat(

        db=db,

        tenant_id=str(tenant.id),

        user_id=str(current_user.id),

        session_id=session_id,

        message=body.message,
    )

    return {
        "success": True,
        "data": result,
    }


@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(get_current_user),
):
    await ai_service.end_session(db, str(tenant.id), session_id)
    return {"success": True, "message": "Session ended."}


@router.get("/sessions")
async def list_sessions(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(get_current_user),
):
    sessions = await ai_service.get_sessions(db, str(tenant.id), str(current_user.id))
    return {"success": True, "data": [SessionOut.model_validate(s) for s in sessions]}


@router.get("/sessions/{session_id}/messages")
async def get_messages(
    session_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(get_current_user),
):
    messages = await ai_service.get_messages(db, str(tenant.id), session_id)
    return {"success": True, "data": [MessageOut.model_validate(m) for m in messages]}


@router.get("/features")
async def list_features(tenant=Depends(get_tenant)):
    return {
        "success": True,
        "data": [
            {"id": "doubt_solver",        "name": "Doubt Solver",         "description": "Get answers to academic questions"},
            {"id": "career_guidance",     "name": "Career Guidance",      "description": "Get career advice and counseling"},
            {"id": "ai_tutor",            "name": "AI Tutor",             "description": "Interactive personalized tutoring"},
            {"id": "roleplay_career",     "name": "Career Roleplay",      "description": "Practice interviews and counseling"},
            {"id": "institute_analytics", "name": "Institute Analytics",  "description": "Data insights for institute owners"},
        ]
    }
    
