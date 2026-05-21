# tools/student/attendance_tool.py

from __future__ import annotations

import logging
from uuid import UUID

from pydantic import ValidationError

from schemas.request_context import RequestContext

from schemas.student_schema import AttendanceMetrics

from services.backend_client import BackendClient

from exceptions.tool_exceptions import (
    ToolExecutionError,
    ResponseValidationError,
)

logger = logging.getLogger(__name__)


class AttendanceTool:

    def __init__(
        self,
        backend_client: BackendClient,
    ) -> None:

        self.backend_client = backend_client

    async def get_attendance_metrics(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> AttendanceMetrics:

        endpoint = f"/students/{student_id}/attendance"

        logger.info(
            "Fetching attendance metrics",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
            },
        )

        try:
            response = await self.backend_client.get(
                endpoint=endpoint,
                request_context=context,
                timeout=10.0,
            )

            validated_response = AttendanceMetrics.model_validate(
                response
            )

            return validated_response

        except ValidationError as exc:
            logger.exception(
                "Attendance validation failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise ResponseValidationError(
                "Invalid attendance response"
            ) from exc

        except Exception as exc:
            logger.exception(
                "Attendance tool execution failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise ToolExecutionError(
                "Attendance tool failed"
            ) from exc