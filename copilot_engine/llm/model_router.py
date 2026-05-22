# ai/llm/model_router.py

import asyncio
import logging

from typing import (
    Dict,
    Optional,
    List,
    Type,
)

from pydantic import BaseModel

from copilot_engine.llm.providers.base_provider import (
    LLMMessage,
    LLMResponse,
)

from copilot_engine.llm.providers.groq_client import (
    GroqProvider,
)

from copilot_engine.llm.parsers.response_parser import (
    ResponseParser,
)

from copilot_engine.guardrails.input_validator import (
    InputValidator,
)

from copilot_engine.guardrails.output_validator import (
    OutputValidator,
)

from copilot_engine.observability.observability_service import (
    ObservabilityService,
)

logger = logging.getLogger(__name__)


# =========================================================
# CUSTOM EXCEPTIONS
# =========================================================

class ProviderNotFoundError(Exception):
    """
    Raised when requested provider
    is not registered.
    """
    pass


class StructuredOutputGenerationError(Exception):
    """
    Raised when structured generation
    fails after all retries.
    """
    pass


# =========================================================
# MODEL ROUTER
# =========================================================

class ModelRouter:

    """
    Central orchestration layer for:
    - LLM provider routing
    - input validation
    - output validation
    - retries
    - observability
    - structured generation
    """

    def __init__(self):

        # =================================================
        # REGISTER PROVIDERS
        # =================================================

        self.providers = {
            "groq": GroqProvider(),
        }

        # =================================================
        # DEFAULT PROVIDER
        # =================================================

        self.default_provider = "groq"

        # =================================================
        # INTERNAL SERVICES
        # =================================================

        self.output_validator = (
            OutputValidator()
        )

        self.response_parser = (
            ResponseParser()
        )

        self.input_validator = (
            InputValidator()
        )

        self.observability = (
            ObservabilityService()
        )

    # =====================================================
    # MAIN GENERATION ENTRY
    # =====================================================

    async def generate_structured_output(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        output_schema: Type[BaseModel],
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500,
        retries: int = 2,
        timeout_seconds: int = 45,
    ) -> BaseModel:

        """
        Main structured generation pipeline.
        """

        selected_provider = (
            provider or self.default_provider
        )

        # =================================================
        # PROVIDER VALIDATION
        # =================================================

        if (
            selected_provider
            not in self.providers
        ):

            raise ProviderNotFoundError(
                f"Provider '{selected_provider}' "
                f"is not registered."
            )

        logger.info(
            "Starting structured LLM generation",
            extra={
                "provider": selected_provider,
                "schema": output_schema.__name__,
                "model": model,
            },
        )

        # =================================================
        # START TRACE
        # =================================================

        trace = (
            self.observability.start_trace(
                operation_name=(
                    "structured_llm_generation"
                ),
                metadata={
                    "provider": selected_provider,
                    "schema": output_schema.__name__,
                },
            )
        )

        try:

            # =============================================
            # VALIDATE USER INPUT
            # =============================================

            validated_user_prompt = (
                await self.input_validator
                .validate_user_input(
                    user_input=user_prompt,
                )
            )

            # =============================================
            # BUILD MESSAGE PAYLOAD
            # =============================================

            messages = [

                LLMMessage(
                    role="system",
                    content=system_prompt,
                ),

                LLMMessage(
                    role="user",
                    content=validated_user_prompt,
                ),
            ]

            last_error = None

            # =============================================
            # RETRY LOOP
            # =============================================

            for attempt in range(
                retries + 1
            ):

                try:

                    logger.info(
                        "Executing LLM request",
                        extra={
                            "attempt": (
                                attempt + 1
                            ),
                            "provider": (
                                selected_provider
                            ),
                        },
                    )

                    provider_instance = (
                        self.providers[
                            selected_provider
                        ]
                    )

                    # =====================================
                    # PROVIDER GENERATION
                    # =====================================

                    response: LLMResponse = (
                        await asyncio.wait_for(

                            provider_instance.generate(
                                messages=messages,
                                model=model,
                                temperature=temperature,
                                max_tokens=max_tokens,
                            ),

                            timeout=timeout_seconds,
                        )
                    )

                    # =====================================
                    # TRACK LLM CALL
                    # =====================================

                    self.observability.track_llm_call(
                        provider=response.provider,
                        model=response.model_name,
                        prompt_tokens=(
                            response.prompt_tokens
                        ),
                        completion_tokens=(
                            response.completion_tokens
                        ),
                        total_tokens=(
                            response.total_tokens
                        ),
                        latency_ms=(
                            response.latency_ms or 0
                        ),
                        success=True,
                    )

                    logger.info(
                        "LLM response received",
                        extra={
                            "provider": (
                                response.provider
                            ),
                            "model": (
                                response.model_name
                            ),
                            "tokens": (
                                response.total_tokens
                            ),
                            "latency_ms": (
                                response.latency_ms
                            ),
                        },
                    )

                    # =====================================
                    # PARSE RAW RESPONSE
                    # =====================================

                    parsed_output = (

                        self.response_parser
                        .parse_json_response(
                            response.content
                        )
                    )

                    # =====================================
                    # VALIDATE OUTPUT
                    # =====================================

                    validated_output = (

                        await self.output_validator
                        .validate_output(
                            output=parsed_output,
                            schema=output_schema,
                        )
                    )

                    logger.info(
                        "Structured output validated",
                        extra={
                            "schema": (
                                output_schema.__name__
                            ),
                        },
                    )

                    # =====================================
                    # END TRACE SUCCESS
                    # =====================================

                    self.observability.end_trace(
                        trace=trace,
                        success=True,
                    )

                    return validated_output

                # =========================================
                # TIMEOUT HANDLING
                # =========================================

                except asyncio.TimeoutError as error:

                    last_error = error

                    logger.exception(
                        "LLM request timed out",
                        extra={
                            "attempt": (
                                attempt + 1
                            ),
                            "timeout_seconds": (
                                timeout_seconds
                            ),
                        },
                    )

                    self.observability.track_error(
                        error_type="TimeoutError",
                        error_message=str(error),
                        context={
                            "provider": (
                                selected_provider
                            ),
                            "attempt": (
                                attempt + 1
                            ),
                        },
                    )

                # =========================================
                # GENERAL FAILURE
                # =========================================

                except Exception as error:

                    last_error = error

                    logger.exception(
                        "LLM generation failed",
                        extra={
                            "attempt": (
                                attempt + 1
                            ),
                            "provider": (
                                selected_provider
                            ),
                            "error": str(error),
                        },
                    )

                    self.observability.track_error(
                        error_type=(
                            type(error).__name__
                        ),
                        error_message=str(error),
                        context={
                            "provider": (
                                selected_provider
                            ),
                            "attempt": (
                                attempt + 1
                            ),
                        },
                    )

                # =========================================
                # RETRY BACKOFF
                # =========================================

                if attempt < retries:

                    backoff_seconds = (
                        2 ** attempt
                    )

                    logger.warning(
                        "Retrying request",
                        extra={
                            "backoff_seconds": (
                                backoff_seconds
                            ),
                        },
                    )

                    await asyncio.sleep(
                        backoff_seconds
                    )

            # =============================================
            # ALL RETRIES FAILED
            # =============================================

            raise StructuredOutputGenerationError(
                "Structured generation failed "
                f"after retries: {str(last_error)}"
            ) from last_error

        # =================================================
        # FINAL PIPELINE FAILURE
        # =================================================

        except Exception as final_error:

            logger.exception(
                "Structured generation pipeline failed",
                extra={
                    "provider": selected_provider,
                    "schema": (
                        output_schema.__name__
                    ),
                    "error": str(final_error),
                },
            )

            self.observability.track_error(
                error_type=(
                    type(final_error).__name__
                ),
                error_message=str(final_error),
                context={
                    "provider": selected_provider,
                    "schema": (
                        output_schema.__name__
                    ),
                },
            )

            self.observability.end_trace(
                trace=trace,
                success=False,
            )

            raise

    # =====================================================
    # PROVIDER HEALTH CHECK
    # =====================================================

    async def health_check(
        self,
    ) -> Dict[str, bool]:

        results = {}

        for (
            provider_name,
            provider_instance,
        ) in self.providers.items():

            try:

                is_healthy = (
                    await provider_instance
                    .health_check()
                )

                results[
                    provider_name
                ] = is_healthy

            except Exception:

                logger.exception(
                    "Provider health check failed",
                    extra={
                        "provider": provider_name,
                    },
                )

                results[
                    provider_name
                ] = False

        return results

    # =====================================================
    # LIST PROVIDERS
    # =====================================================

    def list_providers(
        self,
    ) -> List[str]:

        return list(
            self.providers.keys()
        )