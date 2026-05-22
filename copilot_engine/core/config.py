# core/config.py

from typing import (
    List,
    Optional,
)

from pydantic import (
    Field,
)

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)

import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):

    """
    Global application settings.
    """

    # =====================================================
    # APP
    # =====================================================

    APP_NAME: str = (
        "CoachGenie Copilot Engine"
    )

    APP_ENV: str = (
        "development"
    )

    APP_VERSION: str = (
        "1.0.0"
    )

    DEBUG: bool = True

    # =====================================================
    # API
    # =====================================================

    API_V1_PREFIX: str = (
        "/api/v1"
    )

    HOST: str = (
        "0.0.0.0"
    )

    PORT: int = 9000

    # =====================================================
    # EXISTING BACKEND CONNECTION
    # =====================================================

    BACKEND_API_BASE_URL: str = (
        os.getenv("BACKEND_API_BASE_URL")
    )

    BACKEND_API_BASE_URL_API: str = (
        os.getenv("BACKEND_API_BASE_URL_API")
    )

    BACKEND_API_TIMEOUT: int = 30

    INTERNAL_API_KEY: Optional[str] = None

    # =====================================================
    # DATABASE
    # =====================================================

    DATABASE_URL: str = (
        os.getenv("DATABASE_URL")
    )

    DB_POOL_SIZE: int = 10

    DB_MAX_OVERFLOW: int = 20

    DB_POOL_TIMEOUT: int = 30

    # =====================================================
    # GROQ
    # =====================================================

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")

    GROQ_DEFAULT_MODEL: str = (
        "llama-3.3-70b-versatile"
    )

    GROQ_TIMEOUT_SECONDS: int = 60

    GROQ_MAX_RETRIES: int = 3

    # =====================================================
    # LLM ROUTER
    # =====================================================

    DEFAULT_LLM_PROVIDER: str = (
        "groq"
    )

    DEFAULT_TEMPERATURE: float = 0.2

    DEFAULT_MAX_TOKENS: int = 2000

    DEFAULT_RETRY_COUNT: int = 2

    # =====================================================
    # OBSERVABILITY
    # =====================================================

    ENABLE_OBSERVABILITY: bool = True

    ENABLE_TRACING: bool = True

    ENABLE_METRICS: bool = True

    ENABLE_LLM_LOGGING: bool = True

    # =====================================================
    # LOGGING
    # =====================================================

    LOG_LEVEL: str = (
        "INFO"
    )

    ENABLE_JSON_LOGS: bool = True

    # =====================================================
    # SECURITY
    # =====================================================

    ENABLE_PROMPT_INJECTION_FILTER: bool = True

    MAX_PROMPT_LENGTH: int = 15000

    MAX_RESPONSE_LENGTH: int = 30000

    # =====================================================
    # RATE LIMITING
    # =====================================================

    ENABLE_RATE_LIMITING: bool = True

    RATE_LIMIT_PER_MINUTE: int = 60

    # =====================================================
    # CORS
    # =====================================================

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # =====================================================
    # REPORTS
    # =====================================================

    REPORT_RETENTION_DAYS: int = 90

    ENABLE_REPORT_CACHING: bool = True

    # =====================================================
    # FEATURE FLAGS
    # =====================================================

    ENABLE_STREAMING: bool = False

    ENABLE_AGENT_MEMORY: bool = False

    ENABLE_MULTI_MODEL_ROUTING: bool = False

    # =====================================================
    # PYDANTIC SETTINGS CONFIG
    # =====================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


# =========================================================
# GLOBAL SETTINGS INSTANCE
# =========================================================

settings = Settings()