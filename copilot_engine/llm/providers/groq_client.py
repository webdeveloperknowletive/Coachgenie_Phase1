# ai/llm/providers/groq_provider.py

import os
import time
import logging
import asyncio

from typing import (
    Dict,
    Any,
    List,
    Optional,
)

from groq import AsyncGroq as Groq

from core.config import settings

from llm.providers.base_provider import (
    BaseLLMProvider,
    LLMMessage,
    LLMResponse,
)

from core.exception import (
    LLMException,
)

logger = logging.getLogger(__name__)


class GroqProvider(BaseLLMProvider):

    provider_name = "groq"

    def __init__(self):

        self.api_key = settings("GROQ_API_KEY")

        if not self.api_key:
            raise ValueError(
                "GROQ_API_KEY is missing in environment variables."
            )

        self.default_model = settings("GROQ_DEFAULT_MODEL", default="llama-3.3-70b-versatile")

        self.client = Groq(
            api_key=self.api_key,
        )

    # =====================================================
    # MAIN GENERATION METHOD
    # =====================================================

    async def generate(
        self,
        messages: List[LLMMessage],
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1000,
        response_format: Optional[Dict[str, Any]] = None,
        timeout: int = 30,
    ) -> LLMResponse:

        selected_model = model or self.default_model

        logger.info(
            "Sending request to Groq",
            extra={
                "model": selected_model,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )

        start_time = time.perf_counter()

        try:

            formatted_messages = [
                {
                    "role": msg.role,
                    "content": msg.content,
                }
                for msg in messages
            ]

            response = await self.client.chat.completions.create(
                model=selected_model,
                messages=formatted_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=timeout,
                response_format=response_format,
            )

            latency_ms = int(
                (time.perf_counter() - start_time) * 1000
            )

            content = (
                response.choices[0]
                .message
                .content
            )

            usage = getattr(response, "usage", None)

            prompt_tokens = (
                usage.prompt_tokens
                if usage else 0
            )

            completion_tokens = (
                usage.completion_tokens
                if usage else 0
            )

            total_tokens = (
                usage.total_tokens
                if usage else 0
            )

            finish_reason = (
                response.choices[0]
                .finish_reason
            )

            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    logger.info(
                        "Groq response received successfully",
                        extra={
                            "model": selected_model,
                            "latency_ms": latency_ms,
                            "total_tokens": total_tokens,
                        },
                    )
                ),
                timeout=timeout,
            )
            

            return LLMResponse(
                content=content,
                model_name=selected_model,
                provider=self.provider_name,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                latency_ms=latency_ms,
                finish_reason=finish_reason,
                raw_response=response.model_dump(),
            )

        except Exception as error:

            logger.exception(
                "Groq generation failed",
                extra={
                    "model": selected_model,
                    "provider": self.provider_name,
                    "error": str(error),
                },
            )

            raise LLMException()

    # =====================================================
    # HEALTH CHECK
    # =====================================================

    async def health_check(self) -> bool:

        try:

            response = self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {
                        "role": "user",
                        "content": "ping",
                    }
                ],
                max_tokens=5,
            )

            return bool(response)

        except Exception:

            logger.exception(
                "Groq health check failed"
            )

            return False

    # =====================================================
    # LIST SUPPORTED MODELS
    # =====================================================

    async def list_models(self) -> List[str]:

        return [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
        ]