# ai/services/backend_client.py

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx

from core.config import settings

from schemas.request_context import RequestContext

from exceptions.backend_exceptions import (
    BackendClientError,
    BackendAuthenticationError,
    BackendAuthorizationError,
    BackendTimeoutError,
    BackendConnectionError,
    BackendResponseError,
)

logger = logging.getLogger(__name__)


class BackendClient:
    """
    Enterprise-grade backend API client.

    Responsibilities:
    - Centralized API communication
    - Request tracing
    - Authentication headers
    - Timeout management
    - Retry-safe request handling
    - Structured observability
    - Response normalization

    IMPORTANT:
    This class is the ONLY layer
    allowed to communicate with backend APIs.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: float = 10.0,
    ) -> None:

        self.base_url = (
            base_url
            or settings.BACKEND_API_BASE_URL
        )

        self.timeout = timeout

    # ==========================================================
    # PUBLIC HTTP METHODS
    # ==========================================================

    async def get(
        self,
        endpoint: str,
        request_context: RequestContext,
        timeout: Optional[float] = None,
        query_params: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any] | list[Any]:

        return await self._request(
            method="GET",
            endpoint=endpoint,
            request_context=request_context,
            timeout=timeout,
            query_params=query_params,
        )

    async def post(
        self,
        endpoint: str,
        request_context: RequestContext,
        payload: Optional[dict[str, Any]] = None,
        timeout: Optional[float] = None,
    ) -> dict[str, Any]:

        return await self._request(
            method="POST",
            endpoint=endpoint,
            request_context=request_context,
            timeout=timeout,
            json_payload=payload,
        )

    async def put(
        self,
        endpoint: str,
        request_context: RequestContext,
        payload: Optional[dict[str, Any]] = None,
        timeout: Optional[float] = None,
    ) -> dict[str, Any]:

        return await self._request(
            method="PUT",
            endpoint=endpoint,
            request_context=request_context,
            timeout=timeout,
            json_payload=payload,
        )

    async def delete(
        self,
        endpoint: str,
        request_context: RequestContext,
        timeout: Optional[float] = None,
    ) -> dict[str, Any]:

        return await self._request(
            method="DELETE",
            endpoint=endpoint,
            request_context=request_context,
            timeout=timeout,
        )

    # ==========================================================
    # CORE REQUEST ENGINE
    # ==========================================================

    async def _request(
        self,
        method: str,
        endpoint: str,
        request_context: RequestContext,
        timeout: Optional[float] = None,
        query_params: Optional[dict[str, Any]] = None,
        json_payload: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any] | list[Any]:

        url = f"{self.base_url}{endpoint}"

        request_timeout = timeout or self.timeout

        headers = self._build_headers(
            request_context=request_context,
        )

        logger.info(
            "Backend API request initiated",
            extra={
                "method": method,
                "url": url,
                "request_id": request_context.request_id,
                "user_id": str(request_context.user_id),
                "tenant_id": str(request_context.tenant_id),
            },
        )

        try:
            async with httpx.AsyncClient(
                timeout=request_timeout,
            ) as client:

                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=query_params,
                    json=json_payload,
                )

                self._validate_response_status(
                    response=response,
                    request_context=request_context,
                )

                parsed_response = response.json()

                logger.info(
                    "Backend API request successful",
                    extra={
                        "method": method,
                        "url": url,
                        "status_code": response.status_code,
                        "request_id": request_context.request_id,
                    },
                )

                return parsed_response

        except httpx.TimeoutException as exc:

            logger.exception(
                "Backend API timeout",
                extra={
                    "method": method,
                    "url": url,
                    "request_id": request_context.request_id,
                },
            )

            raise BackendTimeoutError(
                f"Backend request timed out: {endpoint}"
            ) from exc

        except httpx.ConnectError as exc:

            logger.exception(
                "Backend API connection failure",
                extra={
                    "method": method,
                    "url": url,
                    "request_id": request_context.request_id,
                },
            )

            raise BackendConnectionError(
                f"Backend connection failed: {endpoint}"
            ) from exc

        except httpx.HTTPStatusError as exc:

            logger.exception(
                "Backend API HTTP error",
                extra={
                    "method": method,
                    "url": url,
                    "status_code": exc.response.status_code,
                    "request_id": request_context.request_id,
                },
            )

            raise BackendResponseError(
                f"Backend API error: {endpoint}"
            ) from exc

        except Exception as exc:

            logger.exception(
                "Unexpected backend client failure",
                extra={
                    "method": method,
                    "url": url,
                    "request_id": request_context.request_id,
                },
            )

            raise BackendClientError(
                "Unexpected backend client failure"
            ) from exc

    # ==========================================================
    # RESPONSE VALIDATION
    # ==========================================================

    def _validate_response_status(
        self,
        response: httpx.Response,
        request_context: RequestContext,
    ) -> None:

        status_code = response.status_code

        if 200 <= status_code < 300:
            return

        logger.warning(
            "Backend API returned error response",
            extra={
                "status_code": status_code,
                "request_id": request_context.request_id,
            },
        )

        if status_code == 401:
            raise BackendAuthenticationError(
                "Backend authentication failed"
            )

        if status_code == 403:
            raise BackendAuthorizationError(
                "Backend authorization failed"
            )

        response.raise_for_status()

    # ==========================================================
    # HEADER BUILDER
    # ==========================================================

    def _build_headers(
        self,
        request_context: RequestContext,
    ) -> dict[str, str]:

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",

            # ==================================================
            # Request Tracing
            # ==================================================

            "X-Request-ID": request_context.request_id,

            "X-User-ID": str(
                request_context.user_id
            ),

            "X-Tenant-ID": str(
                request_context.tenant_id
            ),
        }

        if request_context.session_id:
            headers["X-Session-ID"] = (
                request_context.session_id
            )

        return headers