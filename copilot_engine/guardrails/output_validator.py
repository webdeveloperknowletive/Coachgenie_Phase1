# guardrails/output_validator.py

from typing import Any, Dict, List, Optional, Type
from uuid import UUID
import logging
import re

from pydantic import (
    BaseModel,
    ValidationError,
)

logger = logging.getLogger(__name__)


# =========================================================
# CUSTOM EXCEPTIONS
# =========================================================

class OutputValidationError(Exception):
    """Raised when AI output validation fails."""


class UnsafeContentError(Exception):
    """Raised when unsafe content is detected."""


class HallucinationRiskError(Exception):
    """Raised when hallucination patterns are detected."""


# =========================================================
# UNSAFE PATTERNS
# =========================================================

UNSAFE_PATTERNS = [
    r"(?i)\badhd\b",
    r"(?i)\bdepression\b",
    r"(?i)\banxiety disorder\b",
    r"(?i)\bmental illness\b",
    r"(?i)\bpsychological disorder\b",
    r"(?i)\bmedically diagnosed\b",
]

NEGATIVE_STUDENT_LABELS = [
    r"(?i)\blazy\b",
    r"(?i)\bstupid\b",
    r"(?i)\bweak student\b",
    r"(?i)\bhopeless\b",
    r"(?i)\bfailure\b",
]

PII_PATTERNS = [
    r"\b\d{12}\b",                # Aadhaar-like
    r"\b\d{10}\b",                # phone numbers
    r"(?i)password",
    r"(?i)secret",
    r"(?i)token",
]


# =========================================================
# MAIN VALIDATOR
# =========================================================

class OutputValidator:

    def __init__(self):
        pass

    # -----------------------------------------------------
    # PUBLIC VALIDATION ENTRY
    # -----------------------------------------------------

    async def validate_output(
        self,
        output: Dict[str, Any],
        schema: Type[BaseModel],
    ) -> BaseModel:

        logger.info(
            "Starting AI output validation",
            extra={
                "schema": schema.__name__,
            },
        )

        # -------------------------------------------------
        # STEP 1: Pydantic Validation
        # -------------------------------------------------

        validated_output = self._validate_schema(
            output=output,
            schema=schema,
        )

        # -------------------------------------------------
        # STEP 2: Safety Validation
        # -------------------------------------------------

        self._validate_safety(validated_output)

        # -------------------------------------------------
        # STEP 3: Hallucination Detection
        # -------------------------------------------------

        self._detect_hallucination_patterns(validated_output)

        # -------------------------------------------------
        # STEP 4: PII Validation
        # -------------------------------------------------

        self._detect_pii(validated_output)

        logger.info(
            "AI output validation successful",
            extra={
                "schema": schema.__name__,
            },
        )

        return validated_output

    # =====================================================
    # SCHEMA VALIDATION
    # =====================================================

    def _validate_schema(
        self,
        output: Dict[str, Any],
        schema: Type[BaseModel],
    ) -> BaseModel:

        try:

            validated = schema.model_validate(output)

            return validated

        except ValidationError as error:

            logger.exception(
                "Pydantic validation failed",
                extra={
                    "schema": schema.__name__,
                    "errors": error.errors(),
                },
            )

            raise OutputValidationError(
                f"Schema validation failed: {error}"
            ) from error

    # =====================================================
    # SAFETY VALIDATION
    # =====================================================

    def _validate_safety(
        self,
        validated_output: BaseModel,
    ) -> None:

        text = self._flatten_text(validated_output.model_dump())

        # -------------------------------------------------
        # Unsafe Medical/Psychological Claims
        # -------------------------------------------------

        for pattern in UNSAFE_PATTERNS:

            if re.search(pattern, text):

                logger.warning(
                    "Unsafe psychological/medical content detected",
                    extra={
                        "pattern": pattern,
                    },
                )

                raise UnsafeContentError(
                    "Unsafe psychological or medical claims detected."
                )

        # -------------------------------------------------
        # Negative Educational Language
        # -------------------------------------------------

        for pattern in NEGATIVE_STUDENT_LABELS:

            if re.search(pattern, text):

                logger.warning(
                    "Negative student labeling detected",
                    extra={
                        "pattern": pattern,
                    },
                )

                raise UnsafeContentError(
                    "Negative or harmful educational language detected."
                )

    # =====================================================
    # HALLUCINATION DETECTION
    # =====================================================

    def _detect_hallucination_patterns(
        self,
        validated_output: BaseModel,
    ) -> None:

        text = self._flatten_text(validated_output.model_dump())

        suspicious_patterns = [
            r"(?i)approximately\s+\d+%",
            r"(?i)assumed",
            r"(?i)estimated marks",
            r"(?i)likely scored",
            r"(?i)probably attended",
        ]

        hallucination_hits = []

        for pattern in suspicious_patterns:

            if re.search(pattern, text):
                hallucination_hits.append(pattern)

        if hallucination_hits:

            logger.warning(
                "Possible hallucination patterns detected",
                extra={
                    "patterns": hallucination_hits,
                },
            )

            raise HallucinationRiskError(
                "Potential hallucination detected in AI output."
            )

    # =====================================================
    # PII DETECTION
    # =====================================================

    def _detect_pii(
        self,
        validated_output: BaseModel,
    ) -> None:

        text = self._flatten_text(validated_output.model_dump())

        for pattern in PII_PATTERNS:

            if re.search(pattern, text):

                logger.warning(
                    "Possible sensitive data detected",
                    extra={
                        "pattern": pattern,
                    },
                )

                raise UnsafeContentError(
                    "Sensitive information detected in output."
                )

    # =====================================================
    # TEXT FLATTENER
    # =====================================================

    def _flatten_text(
        self,
        data: Any,
    ) -> str:

        collected_text: List[str] = []

        def recursive_extract(value: Any):

            if value is None:
                return

            if isinstance(value, str):
                collected_text.append(value)

            elif isinstance(value, UUID):
                collected_text.append(str(value))

            elif isinstance(value, dict):

                for item in value.values():
                    recursive_extract(item)

            elif isinstance(value, list):

                for item in value:
                    recursive_extract(item)

            elif isinstance(value, tuple):

                for item in value:
                    recursive_extract(item)

            elif isinstance(value, BaseModel):

                recursive_extract(value.model_dump())

            else:
                collected_text.append(str(value))

        recursive_extract(data)

        return " ".join(collected_text)

    # =====================================================
    # OPTIONAL SOFT VALIDATION
    # =====================================================

    async def validate_soft_rules(
        self,
        output: Dict[str, Any],
    ) -> List[str]:

        warnings = []

        flattened = self._flatten_text(output)

        if len(flattened) < 50:
            warnings.append(
                "Output is unusually short."
            )

        if "recommendation" not in flattened.lower():
            warnings.append(
                "No actionable recommendations detected."
            )

        if "summary" not in flattened.lower():
            warnings.append(
                "No summary section detected."
            )

        return warnings