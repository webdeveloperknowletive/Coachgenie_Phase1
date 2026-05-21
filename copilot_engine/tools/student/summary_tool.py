# ai/tools/student/summary_tool.py

from __future__ import annotations

import logging
from uuid import UUID

from pydantic import ValidationError

from schemas.request_context import RequestContext

from schemas.student_schema import StudentSummaryData

from services.backend_client import BackendClient

from exceptions.tool_exceptions import (
    ToolExecutionError,
    ResponseValidationError,
)

logger = logging.getLogger(__name__)


class SummaryTool:

    def __init__(
        self,
        backend_client: BackendClient,
    ) -> None:

        self.backend_client = backend_client

    async def get_complete_student_summary(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> StudentSummaryData:

        endpoint = f"/students/{student_id}/summary"

        logger.info(
            "Fetching student summary",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
            },
        )

        try:
            response = await self.backend_client.get(
                endpoint=endpoint,
                request_context=context,
                timeout=15.0,
            )

            validated_response = StudentSummaryData.model_validate(
                response
            )

            return validated_response

        except ValidationError as exc:
            logger.exception(
                "Student summary validation failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise ResponseValidationError(
                "Invalid student summary response"
            ) from exc

        except Exception as exc:
            logger.exception(
                "Summary tool execution failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise ToolExecutionError(
                "Student summary tool failed"
            ) from exc