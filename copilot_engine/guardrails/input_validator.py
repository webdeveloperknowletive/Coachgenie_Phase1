# ai/guardrails/input_validator.py

import re
import logging

from typing import (
    List,
)

logger = logging.getLogger(__name__)


class InputValidator:

    """
    Handles:
    - prompt injection prevention
    - jailbreak detection
    - malicious payload filtering
    - oversized input protection
    """

    # =====================================================
    # CONFIGURATION
    # =====================================================

    MAX_INPUT_LENGTH = 8000

    BLOCKED_PATTERNS = [

        # Prompt injection attempts
        r"ignore previous instructions",

        r"disregard system prompt",

        r"reveal system prompt",

        r"show hidden instructions",

        r"forget your rules",

        r"bypass restrictions",

        r"act as unrestricted ai",

        r"developer mode",

        r"jailbreak",

        r"disable safety",

        r"pretend to be",

        # SQL injection patterns
        r"drop table",

        r"delete from",

        r"union select",

        r"insert into",

        # Script injection
        r"<script>",

        r"</script>",

        r"javascript:",

        # Dangerous command patterns
        r"rm -rf",

        r"sudo ",

        r"chmod 777",

        r"wget http",

        r"curl http",
    ]

    # =====================================================
    # MAIN VALIDATION ENTRY
    # =====================================================

    async def validate_user_input(
        self,
        user_input: str,
    ) -> str:

        logger.info(
            "Validating user input"
        )

        # =============================================
        # BASIC CLEANING
        # =============================================

        cleaned_input = (
            user_input.strip()
        )

        # =============================================
        # EMPTY CHECK
        # =============================================

        if not cleaned_input:

            raise ValueError(
                "Input cannot be empty."
            )

        # =============================================
        # LENGTH CHECK
        # =============================================

        if (
            len(cleaned_input)
            > self.MAX_INPUT_LENGTH
        ):

            raise ValueError(
                "Input exceeds maximum allowed size."
            )

        # =============================================
        # MALICIOUS PATTERN CHECK
        # =============================================

        self._detect_malicious_patterns(
            cleaned_input
        )

        logger.info(
            "User input validated successfully"
        )

        return cleaned_input

    # =====================================================
    # DETECT MALICIOUS PATTERNS
    # =====================================================

    def _detect_malicious_patterns(
        self,
        text: str,
    ) -> None:

        normalized_text = (
            text.lower()
        )

        for pattern in self.BLOCKED_PATTERNS:

            if re.search(
                pattern,
                normalized_text,
                re.IGNORECASE,
            ):

                logger.warning(
                    "Blocked malicious input detected",
                    extra={
                        "pattern": pattern,
                    },
                )

                raise ValueError(
                    "Potentially unsafe input detected."
                )

    # =====================================================
    # OPTIONAL SANITIZATION
    # =====================================================

    def sanitize_input(
        self,
        text: str,
    ) -> str:

        sanitized = text.strip()

        # Remove null bytes

        sanitized = sanitized.replace(
            "\x00",
            ""
        )

        # Remove excessive whitespace

        sanitized = re.sub(
            r"\s+",
            " ",
            sanitized,
        )

        return sanitized