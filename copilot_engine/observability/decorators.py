# ai/observability/decorators.py

import time
import logging
import functools
import asyncio

from typing import (
    Any,
    Callable,
    Optional,
)

logger = logging.getLogger(__name__)


# =========================================================
# TRACK AGENT EXECUTION
# =========================================================

def track_agent_execution(
    agent_action: str,
):

    """
    Decorator for tracking:
    - latency
    - success/failure
    - observability
    - logging

    Usage:

    @track_agent_execution(
        "student_report_generation"
    )

    async def generate_report(...):
        ...
    """

    def decorator(func: Callable):

        @functools.wraps(func)
        async def wrapper(
            self,
            *args,
            **kwargs,
        ):

            start_time = (
                time.perf_counter()
            )

            logger.info(
                "Agent execution started",
                extra={
                    "agent_action": (
                        agent_action
                    ),
                    "function": (
                        func.__name__
                    ),
                },
            )

            try:

                result = await func(
                    self,
                    *args,
                    **kwargs,
                )

                latency_ms = int(
                    (
                        time.perf_counter()
                        - start_time
                    )
                    * 1000
                )

                # =====================================
                # OBSERVABILITY
                # =====================================

                if hasattr(
                    self,
                    "observability",
                ):

                    self.observability.track_agent_execution(
                        agent_name=(
                            self.__class__.__name__
                        ),
                        action=agent_action,
                        success=True,
                        metadata={
                            "latency_ms": (
                                latency_ms
                            ),
                        },
                    )

                logger.info(
                    "Agent execution completed",
                    extra={
                        "agent_action": (
                            agent_action
                        ),
                        "latency_ms": (
                            latency_ms
                        ),
                    },
                )

                return result

            except Exception as error:

                latency_ms = int(
                    (
                        time.perf_counter()
                        - start_time
                    )
                    * 1000
                )

                logger.exception(
                    "Agent execution failed",
                    extra={
                        "agent_action": (
                            agent_action
                        ),
                        "latency_ms": (
                            latency_ms
                        ),
                        "error": str(error),
                    },
                )

                # =====================================
                # OBSERVABILITY
                # =====================================

                if hasattr(
                    self,
                    "observability",
                ):

                    self.observability.track_error(
                        error_type=(
                            type(error).__name__
                        ),
                        error_message=str(error),
                        context={
                            "agent_action": (
                                agent_action
                            ),
                            "function": (
                                func.__name__
                            ),
                        },
                    )

                raise

        return wrapper

    return decorator


# =========================================================
# TRACK TOOL EXECUTION
# =========================================================

def track_tool_execution(
    tool_name: str,
):

    """
    Decorator for:
    - external API tools
    - repositories
    - database tools
    - analytics tools
    """

    def decorator(func: Callable):

        @functools.wraps(func)
        async def wrapper(
            *args,
            **kwargs,
        ):

            start_time = (
                time.perf_counter()
            )

            logger.info(
                "Tool execution started",
                extra={
                    "tool_name": tool_name,
                },
            )

            try:

                result = await func(
                    *args,
                    **kwargs,
                )

                latency_ms = int(
                    (
                        time.perf_counter()
                        - start_time
                    )
                    * 1000
                )

                logger.info(
                    "Tool execution completed",
                    extra={
                        "tool_name": tool_name,
                        "latency_ms": (
                            latency_ms
                        ),
                    },
                )

                return result

            except Exception as error:

                latency_ms = int(
                    (
                        time.perf_counter()
                        - start_time
                    )
                    * 1000
                )

                logger.exception(
                    "Tool execution failed",
                    extra={
                        "tool_name": tool_name,
                        "latency_ms": (
                            latency_ms
                        ),
                        "error": str(error),
                    },
                )

                raise

        return wrapper

    return decorator


# =========================================================
# RETRY DECORATOR
# =========================================================

def retry_async(
    retries: int = 2,
    backoff_base: int = 2,
):

    """
    Async retry decorator.

    Usage:

    @retry_async(
        retries=3
    )

    async def my_function():
        ...
    """

    def decorator(func: Callable):

        @functools.wraps(func)
        async def wrapper(
            *args,
            **kwargs,
        ):

            last_error = None

            for attempt in range(
                retries + 1
            ):

                try:

                    return await func(
                        *args,
                        **kwargs,
                    )

                except Exception as error:

                    last_error = error

                    logger.warning(
                        "Retry attempt failed",
                        extra={
                            "function": (
                                func.__name__
                            ),
                            "attempt": (
                                attempt + 1
                            ),
                            "error": str(error),
                        },
                    )

                    if attempt < retries:

                        backoff_seconds = (
                            backoff_base
                            ** attempt
                        )

                        await asyncio.sleep(
                            backoff_seconds
                        )

            logger.exception(
                "All retry attempts failed",
                extra={
                    "function": (
                        func.__name__
                    ),
                    "error": str(last_error),
                },
            )

            raise last_error

        return wrapper

    return decorator


# =========================================================
# TIME EXECUTION DECORATOR
# =========================================================

def measure_execution_time():

    """
    Simple timing decorator.
    """

    def decorator(func: Callable):

        @functools.wraps(func)
        async def wrapper(
            *args,
            **kwargs,
        ):

            start_time = (
                time.perf_counter()
            )

            result = await func(
                *args,
                **kwargs,
            )

            latency_ms = int(
                (
                    time.perf_counter()
                    - start_time
                )
                * 1000
            )

            logger.info(
                "Execution time measured",
                extra={
                    "function": (
                        func.__name__
                    ),
                    "latency_ms": (
                        latency_ms
                    ),
                },
            )

            return result

        return wrapper

    return decorator