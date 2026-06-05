# ai/dependencies/auth_dependencies.py

from uuid import uuid4

from fastapi import Request

from copilot_engine.schemas.request_context import RequestContext


async def get_request_context(
    request: Request,
) -> RequestContext:

    """
    Creates request context for every AI request.

    Later this can include:
    - JWT extraction
    - tenant resolution
    - permissions
    - role checks
    """

    return RequestContext(
        request_id=str(uuid4()),

        # TEMPORARY PLACEHOLDERS
        user_id="00000000-0000-0000-0000-000000000001",
        tenant_id="00000000-0000-0000-0000-000000000001",

        session_id=request.headers.get(
            "x-session-id",
            None,
        ),
    )