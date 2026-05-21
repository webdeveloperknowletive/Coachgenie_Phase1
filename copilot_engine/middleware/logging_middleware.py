import time
import logging

from fastapi import Request
from starlette.middleware.base import (
    BaseHTTPMiddleware
)
from starlette.responses import Response

from core.logging_config import (
    request_id_context,
    trace_id_context,
    user_id_context,
)

logger = logging.getLogger(__name__)


class LoggingMiddleware(
    BaseHTTPMiddleware
):

    async def dispatch(
        self,
        request: Request,
        call_next,
    ) -> Response:

        start_time = time.time()

        # =====================================================
        # REQUEST CONTEXT
        # =====================================================

        request_id = (
            request_id_context.get()
        )

        trace_id = (
            trace_id_context.get()
        )

        user_id = (
            user_id_context.get()
        )

        # =====================================================
        # REQUEST INFO
        # =====================================================

        method = request.method
        path = request.url.path

        client_host = (
            request.client.host
            if request.client
            else "unknown"
        )

        # =====================================================
        # INCOMING REQUEST LOG
        # =====================================================

        logger.info(
            "Incoming request",
            extra={
                "method": method,
                "path": path,
                "client_host": client_host,
                "request_id": request_id,
                "trace_id": trace_id,
                "user_id": user_id,
            },
        )

        # =====================================================
        # PROCESS REQUEST
        # =====================================================

        try:

            response = await call_next(
                request
            )

        except Exception:

            duration = round(
                time.time() - start_time,
                4,
            )

            logger.exception(
                "Unhandled exception",
                extra={
                    "method": method,
                    "path": path,
                    "duration": duration,
                    "request_id": request_id,
                    "trace_id": trace_id,
                    "user_id": user_id,
                },
            )

            raise

        # =====================================================
        # RESPONSE LOGGING
        # =====================================================

        duration = round(
            time.time() - start_time,
            4,
        )

        logger.info(
            "Request completed",
            extra={
                "method": method,
                "path": path,
                "status_code": (
                    response.status_code
                ),
                "duration": duration,
                "request_id": request_id,
                "trace_id": trace_id,
                "user_id": user_id,
            },
        )

        return response