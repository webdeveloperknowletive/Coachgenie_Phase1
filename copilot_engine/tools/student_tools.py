# ai/tools/student/performance_tool.py

from __future__ import annotations

import logging
from uuid import UUID
from typing import List

import httpx
from pydantic import ValidationError

from schemas.request_context import RequestContext

from schemas.student_schema import (
    StudentPerformanceMetrics,
    SubjectPerformance,
    ImprovementTrendData,
)

from services.backend_client import BackendClient

from exceptions.tool_exceptions import (
    ToolExecutionError,
    BackendServiceError,
    ResponseValidationError,
)

logger = logging.getLogger(__name__)


class PerformanceTool:
    """
    Performance analytics tool.

    Responsibilities:
    - Fetch deterministic student performance data
    - Validate API responses
    - Return typed schemas
    - Handle backend communication safely

    IMPORTANT:
    This tool DOES NOT:
    - generate AI insights
    - call LLMs
    - build prompts
    """

    def __init__(
        self,
        backend_client: BackendClient,
    ) -> None:

        self.backend_client = backend_client

    # ==========================================================
    # PUBLIC METHODS
    # ==========================================================

    async def get_student_performance(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> StudentPerformanceMetrics:

        endpoint = f"/students/{student_id}/performance"

        logger.info(
            "Fetching student performance metrics",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
                "endpoint": endpoint,
            },
        )

        try:
            response = await self.backend_client.get(
                endpoint=endpoint,
                request_context=context,
                timeout=10.0,
            )

            validated_response = StudentPerformanceMetrics.model_validate(
                response
            )

            return validated_response

        except ValidationError as exc:
            logger.exception(
                "Performance response validation failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise ResponseValidationError(
                "Invalid performance response received"
            ) from exc

        except httpx.TimeoutException as exc:
            logger.exception(
                "Performance API timeout",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise BackendServiceError(
                "Performance service timeout"
            ) from exc

        except httpx.HTTPStatusError as exc:
            logger.exception(
                "Performance API returned error status",
                extra={
                    "student_id": str(student_id),
                    "status_code": exc.response.status_code,
                    "request_id": context.request_id,
                },
            )

            raise BackendServiceError(
                "Performance API failed"
            ) from exc

        except Exception as exc:
            logger.exception(
                "Unexpected performance tool failure",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise ToolExecutionError(
                "Student performance tool execution failed"
            ) from exc

    async def get_subject_performance(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> List[SubjectPerformance]:

        endpoint = f"/students/{student_id}/subjects"

        logger.info(
            "Fetching subject performance",
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

            validated_response = [
                SubjectPerformance.model_validate(item)
                for item in response
            ]

            return validated_response

        except ValidationError as exc:
            logger.exception(
                "Subject performance validation failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise ResponseValidationError(
                "Invalid subject performance response"
            ) from exc

        except Exception as exc:
            logger.exception(
                "Subject performance fetch failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise ToolExecutionError(
                "Failed to fetch subject performance"
            ) from exc

    async def get_improvement_trends(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> ImprovementTrendData:

        endpoint = f"/students/{student_id}/improvement-trends"

        logger.info(
            "Fetching improvement trends",
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

            validated_response = ImprovementTrendData.model_validate(
                response
            )

            return validated_response

        except ValidationError as exc:
            logger.exception(
                "Improvement trends validation failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise ResponseValidationError(
                "Invalid improvement trend response"
            ) from exc

        except Exception as exc:
            logger.exception(
                "Improvement trend fetch failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise ToolExecutionError(
                "Failed to fetch improvement trends"
            ) from exc