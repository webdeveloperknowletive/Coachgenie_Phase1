# # ai/observability/observability_service.py

# import time
# import uuid
# import logging
# from dataclasses import dataclass

# from typing import (
#     Any,
#     Dict,
#     Optional,
# )

# logger = logging.getLogger(__name__)


# class ObservabilityService:

#     """
#     Handles:
#     - tracing
#     - execution tracking
#     - latency metrics
#     - token usage metrics
#     - structured logging
#     """

#     # =====================================================
#     # START TRACE
#     # =====================================================

#     def start_trace(
#         self,
#         operation_name: str,
#         metadata: Optional[Dict[str, Any]] = None,
#     ) -> Dict[str, Any]:

#         trace_id = str(uuid.uuid4())

#         trace = {
#             "trace_id": trace_id,
#             "operation_name": operation_name,
#             "start_time": time.perf_counter(),
#             "metadata": metadata or {},
#         }

#         logger.info(
#             "Trace started",
#             extra={
#                 "trace_id": trace_id,
#                 "operation": operation_name,
#                 "metadata": metadata,
#             },
#         )

#         return trace

#     # =====================================================
#     # END TRACE
#     # =====================================================

#     def end_trace(
#         self,
#         trace: Dict[str, Any],
#         success: bool = True,
#         extra_metrics: Optional[Dict[str, Any]] = None,
#     ) -> None:

#         latency_ms = int(
#             (
#                 time.perf_counter()
#                 - trace["start_time"]
#             )
#             * 1000
#         )

#         logger.info(
#             "Trace completed",
#             extra={
#                 "trace_id": trace["trace_id"],
#                 "operation": trace["operation_name"],
#                 "latency_ms": latency_ms,
#                 "success": success,
#                 "metrics": extra_metrics or {},
#             },
#         )

#     # =====================================================
#     # TRACK LLM CALL
#     # =====================================================

#     def track_llm_call(
#         self,
#         *,
#         provider: str,
#         model: str,
#         prompt_tokens: int,
#         completion_tokens: int,
#         total_tokens: int,
#         latency_ms: int,
#         success: bool,
#     ) -> None:

#         logger.info(
#             "LLM call tracked",
#             extra={
#                 "provider": provider,
#                 "model": model,
#                 "prompt_tokens": prompt_tokens,
#                 "completion_tokens": completion_tokens,
#                 "total_tokens": total_tokens,
#                 "latency_ms": latency_ms,
#                 "success": success,
#             },
#         )

#     # =====================================================
#     # TRACK AGENT EXECUTION
#     # =====================================================

#     def track_agent_execution(
#         self,
#         *,
#         agent_name: str,
#         action: str,
#         user_id: Optional[str] = None,
#         request_id: Optional[str] = None,
#         success: bool = True,
#         metadata: Optional[Dict[str, Any]] = None,
#     ) -> None:

#         logger.info(
#             "Agent execution tracked",
#             extra={
#                 "agent_name": agent_name,
#                 "action": action,
#                 "user_id": user_id,
#                 "request_id": request_id,
#                 "success": success,
#                 "metadata": metadata or {},
#             },
#         )

#     # =====================================================
#     # TRACK TOOL EXECUTION
#     # =====================================================

#     def track_tool_execution(
#         self,
#         *,
#         tool_name: str,
#         latency_ms: int,
#         success: bool,
#         metadata: Optional[Dict[str, Any]] = None,
#     ) -> None:

#         logger.info(
#             "Tool execution tracked",
#             extra={
#                 "tool_name": tool_name,
#                 "latency_ms": latency_ms,
#                 "success": success,
#                 "metadata": metadata or {},
#             },
#         )

#     # =====================================================
#     # TRACK ERRORS
#     # =====================================================

#     def track_error(
#         self,
#         *,
#         error_type: str,
#         error_message: str,
#         context: Optional[Dict[str, Any]] = None,
#     ) -> None:

#         logger.error(
#             "Tracked system error",
#             extra={
#                 "error_type": error_type,
#                 "error_message": error_message,
#                 "context": context or {},
#             },
#         )

# ===========================================================
# ai/observability/observability_service.py
# ===========================================================

# ai/observability/observability_service.py

import time
import uuid
import logging

from dataclasses import (
    dataclass,
    field,
)

from typing import (
    Any,
    Dict,
    Optional,
)

logger = logging.getLogger(__name__)


# =========================================================
# TRACE MODEL
# =========================================================

@dataclass
class TraceContext:

    trace_id: str

    operation_name: str

    start_time: float

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    request_id: Optional[str] = None

    user_id: Optional[str] = None

    agent_name: Optional[str] = None


# =========================================================
# OBSERVABILITY SERVICE
# =========================================================

class ObservabilityService:

    """
    Enterprise-grade observability layer.

    Responsibilities:
    - distributed tracing
    - structured execution tracking
    - latency metrics
    - llm metrics
    - agent execution metrics
    - tool execution metrics
    - error monitoring
    - production-grade logging
    """

    # =====================================================
    # START TRACE
    # =====================================================

    def start_trace(
        self,
        *,
        operation_name: str,
        metadata: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        agent_name: Optional[str] = None,
    ) -> TraceContext:

        trace = TraceContext(
            trace_id=str(uuid.uuid4()),
            operation_name=operation_name,
            start_time=time.perf_counter(),
            metadata=metadata or {},
            request_id=request_id,
            user_id=user_id,
            agent_name=agent_name,
        )

        logger.info(
            "Trace started",
            extra={
                "trace_id": trace.trace_id,
                "operation_name": (
                    trace.operation_name
                ),
                "request_id": trace.request_id,
                "user_id": trace.user_id,
                "agent_name": trace.agent_name,
                "metadata": trace.metadata,
            },
        )

        return trace

    # =====================================================
    # END TRACE
    # =====================================================

    def end_trace(
        self,
        *,
        trace: TraceContext,
        success: bool = True,
        extra_metrics: Optional[
            Dict[str, Any]
        ] = None,
    ) -> None:

        latency_ms = int(
            (
                time.perf_counter()
                - trace.start_time
            )
            * 1000
        )

        logger.info(
            "Trace completed",
            extra={
                "trace_id": trace.trace_id,
                "operation_name": (
                    trace.operation_name
                ),
                "request_id": trace.request_id,
                "user_id": trace.user_id,
                "agent_name": trace.agent_name,
                "latency_ms": latency_ms,
                "success": success,
                "extra_metrics": (
                    extra_metrics or {}
                ),
            },
        )

    # =====================================================
    # TRACK LLM CALL
    # =====================================================

    def track_llm_call(
        self,
        *,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int,
        latency_ms: int,
        success: bool,
        trace_id: Optional[str] = None,
    ) -> None:

        logger.info(
            "LLM call tracked",
            extra={
                "trace_id": trace_id,
                "provider": provider,
                "model": model,
                "prompt_tokens": (
                    prompt_tokens
                ),
                "completion_tokens": (
                    completion_tokens
                ),
                "total_tokens": total_tokens,
                "latency_ms": latency_ms,
                "success": success,
            },
        )

    # =====================================================
    # TRACK AGENT EXECUTION
    # =====================================================

    def track_agent_execution(
        self,
        *,
        agent_name: str,
        action: str,
        success: bool,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[
            Dict[str, Any]
        ] = None,
    ) -> None:

        logger.info(
            "Agent execution tracked",
            extra={
                "agent_name": agent_name,
                "action": action,
                "request_id": request_id,
                "user_id": user_id,
                "success": success,
                "metadata": metadata or {},
            },
        )

    # =====================================================
    # TRACK TOOL EXECUTION
    # =====================================================

    def track_tool_execution(
        self,
        *,
        tool_name: str,
        latency_ms: int,
        success: bool,
        request_id: Optional[str] = None,
        metadata: Optional[
            Dict[str, Any]
        ] = None,
    ) -> None:

        logger.info(
            "Tool execution tracked",
            extra={
                "tool_name": tool_name,
                "latency_ms": latency_ms,
                "success": success,
                "request_id": request_id,
                "metadata": metadata or {},
            },
        )

    # =====================================================
    # TRACK DATABASE QUERY
    # =====================================================

    def track_database_query(
        self,
        *,
        operation: str,
        table_name: str,
        latency_ms: int,
        success: bool,
    ) -> None:

        logger.info(
            "Database query tracked",
            extra={
                "operation": operation,
                "table_name": table_name,
                "latency_ms": latency_ms,
                "success": success,
            },
        )

    # =====================================================
    # TRACK API CALL
    # =====================================================

    def track_external_api_call(
        self,
        *,
        service_name: str,
        endpoint: str,
        latency_ms: int,
        status_code: int,
        success: bool,
    ) -> None:

        logger.info(
            "External API call tracked",
            extra={
                "service_name": service_name,
                "endpoint": endpoint,
                "latency_ms": latency_ms,
                "status_code": status_code,
                "success": success,
            },
        )

    # =====================================================
    # TRACK SECURITY EVENT
    # =====================================================

    def track_security_event(
        self,
        *,
        event_type: str,
        severity: str,
        message: str,
        metadata: Optional[
            Dict[str, Any]
        ] = None,
    ) -> None:

        logger.warning(
            "Security event tracked",
            extra={
                "event_type": event_type,
                "severity": severity,
                "message": message,
                "metadata": metadata or {},
            },
        )

    # =====================================================
    # TRACK ERROR
    # =====================================================

    def track_error(
        self,
        *,
        error_type: str,
        error_message: str,
        context: Optional[
            Dict[str, Any]
        ] = None,
        trace_id: Optional[str] = None,
    ) -> None:

        logger.error(
            "Tracked system error",
            extra={
                "trace_id": trace_id,
                "error_type": error_type,
                "error_message": (
                    error_message
                ),
                "context": context or {},
            },
        )

    # =====================================================
    # TRACK CACHE EVENT
    # =====================================================

    def track_cache_event(
        self,
        *,
        cache_key: str,
        hit: bool,
        latency_ms: Optional[int] = None,
    ) -> None:

        logger.info(
            "Cache event tracked",
            extra={
                "cache_key": cache_key,
                "cache_hit": hit,
                "latency_ms": latency_ms,
            },
        )

    # =====================================================
    # GENERATE TRACE ID
    # =====================================================

    def generate_trace_id(self) -> str:

        return str(uuid.uuid4())

    # =====================================================
    # GENERATE REQUEST ID
    # =====================================================

    def generate_request_id(self) -> str:

        return str(uuid.uuid4())