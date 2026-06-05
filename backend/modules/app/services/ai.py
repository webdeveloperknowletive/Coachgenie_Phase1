from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.ai import AISession, AIMessage
from app.utils.exceptions import NotFoundError, BadRequestError
from app.config import settings

# System prompts for each AI feature
SYSTEM_PROMPTS = {
    "doubt_solver": (
        "You are a helpful academic tutor for coaching institute students in India. "
        "Answer doubts clearly with step-by-step explanations. "
        "Use simple language suitable for Class 11-12 students. "
        "Give examples and analogies to explain complex concepts."
    ),
    "career_guidance": (
        "You are an experienced career counselor for Indian students. "
        "Give balanced, practical advice based on the student's interests and aptitude. "
        "Consider Indian education system, entrance exams (JEE, NEET, CAT, UPSC etc). "
        "Be encouraging but realistic about career prospects."
    ),
    "ai_tutor": (
        "You are a personalized AI tutor for Indian coaching institute students. "
        "Teach concepts interactively, ask questions to check understanding. "
        "Adapt to the student's level. Break down complex topics into simple steps. "
        "Focus on exam-oriented learning for JEE, NEET, and board exams."
    ),
    "roleplay_career": (
        "Conduct a realistic career roleplay session for Indian students. "
        "Simulate job interviews, college admissions interviews, or career counseling. "
        "Give constructive feedback after each response. "
        "Help students prepare for real-world career situations."
    ),
    "institute_analytics": (
        "You are an analytics assistant for a coaching institute owner in India. "
        "Provide data-driven insights, identify trends, and suggest improvements. "
        "Focus on student performance, attendance, revenue, and batch management. "
        "Be concise and actionable in your recommendations."
    ),
}


async def start_session(
    db: AsyncSession,
    tenant_id: str,
    user_id: str,
    feature: str,
    student_id: str | None = None
) -> AISession:
    # Validate feature
    valid_features = list(SYSTEM_PROMPTS.keys())
    if feature not in valid_features:
        raise BadRequestError(f"Invalid feature. Must be one of: {valid_features}")

    session = AISession(
        tenant_id=tenant_id,
        user_id=user_id,
        feature=feature,
        student_id=student_id,
        model_used="gpt-4o-mini",
        total_tokens=0,
    )
    db.add(session)
    await db.flush()
    return session


async def chat(
    db: AsyncSession,
    tenant_id: str,
    session_id: str,
    user_message: str
) -> dict:
    # Get session
    result = await db.execute(
        select(AISession).where(
            and_(AISession.id == session_id, AISession.tenant_id == tenant_id)
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("AI Session")
    if session.ended_at:
        raise BadRequestError("This session has already ended.")

    # Check if OpenAI is configured
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "sk-fill-this-later":
        # Return mock response if OpenAI not configured
        mock_reply = f"[AI Demo Mode] You asked: '{user_message}'. To enable real AI responses, add your OpenAI API key to the .env file."

        # Save user message
        user_msg = AIMessage(
            session_id=session_id,
            tenant_id=tenant_id,
            role="user",
            content=user_message,
        )
        db.add(user_msg)

        # Save assistant reply
        assistant_msg = AIMessage(
            session_id=session_id,
            tenant_id=tenant_id,
            role="assistant",
            content=mock_reply,
            tokens=0,
        )
        db.add(assistant_msg)
        await db.flush()

        return {
            "reply": mock_reply,
            "tokens_used": 0,
            "session_id": session_id,
        }

    # Real OpenAI call
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        # Save user message
        user_msg = AIMessage(
            session_id=session_id,
            tenant_id=tenant_id,
            role="user",
            content=user_message,
        )
        db.add(user_msg)
        await db.flush()

        # Load conversation history (last 20 messages)
        history_result = await db.execute(
            select(AIMessage)
            .where(AIMessage.session_id == session_id)
            .order_by(AIMessage.created_at.asc())
            .limit(20)
        )
        history = history_result.scalars().all()

        # Build messages for OpenAI
        system_prompt = SYSTEM_PROMPTS.get(session.feature, SYSTEM_PROMPTS["doubt_solver"])
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})

        # Call OpenAI
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )

        reply = completion.choices[0].message.content or ""
        tokens_used = completion.usage.total_tokens if completion.usage else 0

        # Save assistant reply
        assistant_msg = AIMessage(
            session_id=session_id,
            tenant_id=tenant_id,
            role="assistant",
            content=reply,
            tokens=tokens_used,
        )
        db.add(assistant_msg)

        # Update session token count
        session.total_tokens = (session.total_tokens or 0) + tokens_used
        await db.flush()

        return {
            "reply": reply,
            "tokens_used": tokens_used,
            "session_id": session_id,
        }

    except Exception as e:
        raise BadRequestError(f"AI service error: {str(e)}")


async def end_session(db: AsyncSession, tenant_id: str, session_id: str):
    result = await db.execute(
        select(AISession).where(
            and_(AISession.id == session_id, AISession.tenant_id == tenant_id)
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("AI Session")
    session.ended_at = datetime.now(timezone.utc)
    await db.flush()


async def get_sessions(db: AsyncSession, tenant_id: str, user_id: str) -> list:
    result = await db.execute(
        select(AISession).where(
            and_(AISession.tenant_id == tenant_id, AISession.user_id == user_id)
        ).order_by(AISession.started_at.desc())
    )
    return result.scalars().all()


async def get_messages(db: AsyncSession, tenant_id: str, session_id: str) -> list:
    result = await db.execute(
        select(AIMessage).where(
            and_(AIMessage.session_id == session_id, AIMessage.tenant_id == tenant_id)
        ).order_by(AIMessage.created_at.asc())
    )
    return result.scalars().all()
