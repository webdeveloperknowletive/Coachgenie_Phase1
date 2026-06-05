"""
copilot_engine/core/model_router.py

Routes LLM requests to the appropriate provider (Groq primary).
Exposes two public methods:
  - generate()                  → plain text, used by ChatHandler / CopilotOrchestrator
  - generate_structured_output() → validated Pydantic model, used by StudentAgent
"""

from __future__ import annotations

import asyncio
from typing import Any, Type, TypeVar

import structlog
from pydantic import BaseModel, ValidationError

from ..core.config import settings
from copilot_engine.llm.providers.groq_client import GroqProvider
from copilot_engine.guardrails.output_validator import OutputValidator

logger = structlog.get_logger(__name__)

T = TypeVar("T", bound=BaseModel)


class ModelRouterError(Exception):
    """Raised when routing or provider call fails unrecoverably."""


class ModelRouter:
    """
    Central LLM routing layer for the copilot engine.

    Current provider: Groq (LLaMA 3.3 70B)
    Future: swap / add providers here without touching agents.
    """

    def __init__(self) -> None:
        self.primary_provider = GroqProvider(
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_DEFAULT_MODEL,          # e.g. "llama-3.3-70b-versatile"
            timeout=settings.GROQ_TIMEOUT_SECONDS,      # seconds, e.g. 30
        )
        self.output_validator = OutputValidator()
        self._log = logger.bind(component="ModelRouter")

    # ------------------------------------------------------------------
    # Public: plain-text generation (chat, summaries, freeform Q&A)
    # ------------------------------------------------------------------

    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 800,
        retries: int = 2,
    ) -> str:
        """
        Generate a plain-text response from the LLM.

        Used by:
          - CopilotOrchestrator._handle_freeform_chat()
          - Any agent method that needs a narrative string rather than JSON.

        Returns:
            Raw LLM response string (not validated against a schema).

        Raises:
            ModelRouterError: if all retry attempts fail.
        """
        self._log.info("generate.start", prompt_length=len(prompt))

        last_exc: Exception | None = None
        for attempt in range(1, retries + 2):
            try:
                response = await self.primary_provider.generate(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                self._log.info("generate.success", attempt=attempt)
                return response

            except asyncio.TimeoutError as exc:
                last_exc = exc
                self._log.warning(
                    "generate.timeout",
                    attempt=attempt,
                    max_attempts=retries + 1,
                )
                if attempt <= retries:
                    await asyncio.sleep(1.0 * attempt)  # linear back-off

            except Exception as exc:
                last_exc = exc
                self._log.error(
                    "generate.error",
                    attempt=attempt,
                    error=str(exc),
                )
                if attempt <= retries:
                    await asyncio.sleep(0.5 * attempt)

        raise ModelRouterError(
            f"All {retries + 1} attempts failed. Last error: {last_exc}"
        ) from last_exc

    # ------------------------------------------------------------------
    # Public: structured output generation (reports, risk, summaries)
    # ------------------------------------------------------------------

    async def generate_structured_output(
        self,
        task: str,
        prompt: str,
        system_prompt: str,
        output_schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 1500,
        retries: int = 2,
    ) -> T:
        """
        Generate a JSON-structured response and parse it into a Pydantic model.

        Used by:
          - StudentAgent.generate_performance_report()
          - StudentAgent.generate_parent_report()
          - StudentAgent.generate_risk_assessment()
          - StudentAgent.generate_growth_card()

        Args:
            task:          Short label for observability (e.g. "performance_report").
            prompt:        The user/data prompt.
            system_prompt: The system instruction (should demand JSON-only output).
            output_schema: Pydantic model class to parse the response into.
            temperature:   Lower = more deterministic JSON. Default 0.2.
            max_tokens:    Default 1500 to fit full report schemas.
            retries:       How many extra attempts on parse failure.

        Returns:
            Validated instance of output_schema.

        Raises:
            ModelRouterError: if LLM calls all fail or output never parses.
        """
        self._log.info("generate_structured_output.start", task=task)

        json_system_prompt = self._enforce_json_output(system_prompt, output_schema)

        last_exc: Exception | None = None
        for attempt in range(1, retries + 2):
            try:
                raw = await self.primary_provider.generate(
                    prompt=prompt,
                    system_prompt=json_system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

                parsed = self._parse_json_response(raw, output_schema)

                # Run output safety validation
                validation_result = self.output_validator.validate(
                    response=raw,
                    schema=output_schema,
                )
                if not validation_result.is_valid:
                    self._log.warning(
                        "generate_structured_output.safety_fail",
                        task=task,
                        reason=validation_result.rejection_reason,
                        attempt=attempt,
                    )
                    if attempt <= retries:
                        await asyncio.sleep(0.5 * attempt)
                        continue
                    raise ModelRouterError(
                        f"Output failed safety validation: {validation_result.rejection_reason}"
                    )

                self._log.info("generate_structured_output.success", task=task, attempt=attempt)
                return parsed

            except (ValidationError, ValueError) as exc:
                last_exc = exc
                self._log.warning(
                    "generate_structured_output.parse_fail",
                    task=task,
                    attempt=attempt,
                    error=str(exc),
                )
                if attempt <= retries:
                    await asyncio.sleep(0.5 * attempt)

            except asyncio.TimeoutError as exc:
                last_exc = exc
                self._log.warning(
                    "generate_structured_output.timeout",
                    task=task,
                    attempt=attempt,
                )
                if attempt <= retries:
                    await asyncio.sleep(1.0 * attempt)

            except Exception as exc:
                last_exc = exc
                self._log.error(
                    "generate_structured_output.error",
                    task=task,
                    attempt=attempt,
                    error=str(exc),
                )
                if attempt <= retries:
                    await asyncio.sleep(0.5 * attempt)

        raise ModelRouterError(
            f"[{task}] All {retries + 1} attempts failed. Last error: {last_exc}"
        ) from last_exc

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _enforce_json_output(
        self,
        system_prompt: str,
        schema: Type[BaseModel],
    ) -> str:
        """
        Appends a strict JSON-only instruction to the system prompt,
        including the schema's field names so the LLM knows what to emit.
        """
        fields = list(schema.model_fields.keys())
        return (
            f"{system_prompt}\n\n"
            f"IMPORTANT: Respond ONLY with a valid JSON object. "
            f"No preamble, no explanation, no markdown fences. "
            f"Required top-level fields: {', '.join(fields)}."
        )

    def _parse_json_response(self, raw: str, schema: Type[T]) -> T:
        """
        Strips markdown fences if present, then parses into the schema.
        Raises ValueError if the content cannot be parsed.
        """
        import json
        import re

        # Strip ```json ... ``` or ``` ... ``` wrappers
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned.strip())

        try:
            data: Any = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise ValueError(f"LLM returned invalid JSON: {exc}\nRaw: {raw[:300]}") from exc

        return schema.model_validate(data)