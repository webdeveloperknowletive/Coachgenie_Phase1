# ai/tools/student/risk_tool.py

from __future__ import annotations

import logging

from pydantic import ValidationError

from schemas.request_context import RequestContext

from schemas.student_schema import RiskCandidate

from services.backend_client import BackendClient

from exceptions.tool_exceptions import (
    ToolExecutionError,
    ResponseValidationError,
)

logger = logging.getLogger(__name__)


class RiskTool:

    def __init__(
        self,
        backend_client: BackendClient,
    ) -> None:

        self.backend_client = backend_client

    async def get_risk_candidates(
        self,
        context: RequestContext,
    ) -> list[RiskCandidate]:

        endpoint = "/students/risk-candidates"

        logger.info(
            "Fetching risk candidates",
            extra={
                "request_id": context.request_id,
            },
        )

        try:
            response = await self.backend_client.get(
                endpoint=endpoint,
                request_context=context,
                timeout=15.0,
            )

            validated_response = [
                RiskCandidate.model_validate(item)
                for item in response
            ]

            return validated_response

        except ValidationError as exc:
            logger.exception(
                "Risk candidate validation failed",
                extra={
                    "request_id": context.request_id,
                },
            )

            raise ResponseValidationError(
                "Invalid risk candidate response"
            ) from exc

        except Exception as exc:
            logger.exception(
                "Risk tool execution failed",
                extra={
                    "request_id": context.request_id,
                },
            )

            raise ToolExecutionError(
                "Risk tool execution failed"
            ) from exc