import logging
from typing import Any, Dict, Optional

import httpx

from fastapi import HTTPException

logger = logging.getLogger(__name__)


# =========================================================
# CONFIG
# =========================================================

COPILOT_ENGINE_BASE_URL = (
    "http://127.0.0.1:8001"
)

DEFAULT_TIMEOUT = 120.0


# =========================================================
# CLIENT
# =========================================================

class CopilotClient:

    """
    Centralized client for communicating with
    the Coach Genie Copilot Engine.
    """

    @staticmethod
    async def post(
        *,
        endpoint: str,
        payload: Dict[str, Any],
        timeout: float = DEFAULT_TIMEOUT,
    ) -> Dict[str, Any]:

        url = (
            f"{COPILOT_ENGINE_BASE_URL}"
            f"{endpoint}"
        )

        logger.info(
            "Calling Copilot Engine",
            extra={
                "url": url,
                "payload_keys": list(payload.keys()),
            },
        )

        try:

            async with httpx.AsyncClient(
                timeout=timeout,
            ) as client:

                response = await client.post(
                    url,
                    json=payload,
                )

            # =====================================
            # HTTP ERROR HANDLING
            # =====================================

            response.raise_for_status()

            data = response.json()

            logger.info(
                "Copilot Engine response received",
                extra={
                    "status_code": response.status_code,
                },
            )

            return data

        except httpx.TimeoutException:

            logger.exception(
                "Copilot Engine timeout"
            )

            raise HTTPException(
                status_code=504,
                detail=(
                    "AI service timeout."
                ),
            )

        except httpx.HTTPStatusError as e:

            logger.exception(
                "Copilot Engine HTTP error"
            )

            try:
                error_body = e.response.json()
            except Exception:
                error_body = e.response.text

            raise HTTPException(
                status_code=e.response.status_code,
                detail={
                    "message": (
                        "Copilot Engine error"
                    ),
                    "error": error_body,
                },
            )

        except Exception:

            logger.exception(
                "Unexpected Copilot Engine failure"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to communicate "
                    "with AI engine."
                ),
            )

    # =====================================================
    # CHAT
    # =====================================================

    @staticmethod
    async def chat(
        *,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        user_id: str = "dashboard-user",
        session_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> Dict[str, Any]:

        payload = {
            "user_id": user_id,
            "message": message,
            "session_id": session_id,
            "tenant_id": tenant_id,
            "context": context or {},
        }

        return await CopilotClient.post(
            endpoint="/copilot/chat",
            payload=payload,
        )

    # =====================================================
    # STUDENT PERFORMANCE REPORT
    # =====================================================

    @staticmethod
    async def generate_student_performance_report(
        *,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:

        return await CopilotClient.post(
            endpoint=(
                "/reports/"
                "student-performance"
            ),
            payload=payload,
            timeout=180,
        )

    # =====================================================
    # ATTENDANCE REPORT
    # =====================================================

    @staticmethod
    async def generate_attendance_report(
        *,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:

        return await CopilotClient.post(
            endpoint=(
                "/reports/"
                "attendance-engagement"
            ),
            payload=payload,
            timeout=180,
        )

    # =====================================================
    # BATCH PERFORMANCE REPORT
    # =====================================================

    @staticmethod
    async def generate_batch_performance_report(
        *,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:

        return await CopilotClient.post(
            endpoint=(
                "/reports/"
                "batch-performance"
            ),
            payload=payload,
            timeout=180,
        )