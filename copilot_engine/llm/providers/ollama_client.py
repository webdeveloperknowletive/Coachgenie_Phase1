import ollama
from copilot_engine.core.config import settings
from copilot_engine.llm.providers.base_provider import (
    BaseLLMProvider,
    LLMMessage,
    LLMResponse,
)
from copilot_engine.core.exception import (
    LLMException,
)
import logging
import asyncio
import time

logger = logging.getLogger(__name__)