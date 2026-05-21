import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from core.logging_config import (
    generate_request_id,
    generate_trace_id,
    set_request_context,
    clear_request_context,
)


class RequestContextMiddleware(
    BaseHTTPMiddleware
):

    async def dispatch(
        self,
        request: Request,
        call_next,
    ) -> Response:

        # =====================================================
        # GENERATE IDS
        # =====================================================

        request_id = (
            request.headers.get(
                "X-Request-ID"
            )
            or generate_request_id()
        )

        trace_id = (
            request.headers.get(
                "X-Trace-ID"
            )
            or generate_trace_id()
        )

        user_id = (
            request.headers.get(
                "X-User-ID"
            )
            or "anonymous"
        )

        # =====================================================
        # STORE REQUEST CONTEXT
        # =====================================================

        set_request_context(
            request_id=request_id,
            trace_id=trace_id,
            user_id=user_id,
        )

        # =====================================================
        # REQUEST STATE
        # =====================================================

        request.state.request_id = (
            request_id
        )

        request.state.trace_id = (
            trace_id
        )

        request.state.user_id = (
            user_id
        )

        # =====================================================
        # REQUEST TIMING
        # =====================================================

        start_time = time.time()

        # =====================================================
        # PROCESS REQUEST
        # =====================================================

        response = await call_next(
            request
        )

        process_time = round(
            time.time() - start_time,
            4,
        )

        # =====================================================
        # RESPONSE HEADERS
        # =====================================================

        response.headers[
            "X-Request-ID"
        ] = request_id

        response.headers[
            "X-Trace-ID"
        ] = trace_id

        response.headers[
            "X-Process-Time"
        ] = str(process_time)

        # =====================================================
        # CLEANUP
        # =====================================================

        clear_request_context()

        return response