# ai/llm/providers/base_provider.py

from abc import ABC, abstractmethod

from typing import (
    Any,
    Dict,
    List,
    Optional,
)

from pydantic import BaseModel


# =========================================================
# STANDARDIZED LLM RESPONSE
# =========================================================

class LLMResponse(BaseModel):
    
    model_config = {
        "protected_namespaces": ()
    }

    content: str

    model_name: str

    provider: str

    prompt_tokens: int = 0

    completion_tokens: int = 0

    total_tokens: int = 0

    latency_ms: Optional[int] = None

    finish_reason: Optional[str] = None

    raw_response: Optional[Dict[str, Any]] = None
    
    structured_output: Optional[Dict[str, Any]] = None

    tool_calls: Optional[List[Dict[str, Any]]] = None

    metadata: Optional[Dict[str, Any]] = None


# =========================================================
# STANDARDIZED MESSAGE FORMAT
# =========================================================

class LLMMessage(BaseModel):

    role: str

    content: str


# =========================================================
# ABSTRACT BASE PROVIDER
# =========================================================

class BaseLLMProvider(ABC):

    """
    Abstract base class for all LLM providers.

    Every provider implementation must follow this contract.
    """

    provider_name: str

    # -----------------------------------------------------
    # MAIN GENERATION METHOD
    # -----------------------------------------------------

    @abstractmethod
    async def generate(
        self,
        messages: List[LLMMessage],
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 1000,
        response_format: Optional[Dict[str, Any]] = None,
        timeout: int = 30,
    ) -> LLMResponse:

        """
        Generate response from LLM.
        """

        raise NotImplementedError

    # -----------------------------------------------------
    # HEALTH CHECK
    # -----------------------------------------------------

    @abstractmethod
    async def health_check(self) -> bool:

        """
        Check if provider is healthy.
        """

        raise NotImplementedError

    # -----------------------------------------------------
    # MODEL LISTING
    # -----------------------------------------------------

    @abstractmethod
    async def list_models(self) -> List[str]:

        """
        List supported models.
        """

        raise NotImplementedError
    
    @abstractmethod
    async def generate_stream(
        self,
        messages: List[LLMMessage],
        model: str,
    ):
        """
        Stream LLM responses.
        """
        raise NotImplementedError