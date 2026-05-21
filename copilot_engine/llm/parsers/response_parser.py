# ai/llm/parsers/response_parser.py

import json
import re
import logging
import unicodedata

from typing import (
    Any,
    Dict,
    List,
    Type,
    Union,
)

from observability.observability_service import (
    ObservabilityService,
)

from core.exception import (
    ResponseParsingError,
)

logger = logging.getLogger(__name__)


class ResponseParser:

    """
    Enterprise-grade LLM response parser.

    Responsibilities:
    - markdown cleanup
    - unicode normalization
    - json extraction
    - malformed json repair
    - truncation repair
    - security filtering
    - prompt leakage detection
    - safe parsing
    - structured observability
    """

    # =====================================================
    # SUSPICIOUS LEAKAGE PATTERNS
    # =====================================================

    SUSPICIOUS_PATTERNS = [
        r"system\s+prompt",
        r"developer\s+message",
        r"hidden\s+instructions",
        r"internal\s+prompt",
        r"chain[\s\-_]?of[\s\-_]?thought",
        r"reasoning\s+trace",
        r"assistant\s+policy",
    ]

    # =====================================================
    # INIT
    # =====================================================

    def __init__(self):

        self.observability = (
            ObservabilityService()
        )

    # =====================================================
    # MAIN PARSER ENTRY
    # =====================================================

    def parse_json_response(
        self,
        raw_response: str,
        expected_type: Type = dict,
    ) -> Union[Dict[str, Any], List[Any]]:

        trace = (
            self.observability.start_trace(
                operation_name="response_parsing",
                metadata={
                    "expected_type": str(expected_type),
                },
            )
        )

        logger.info(
            "Starting response parsing"
        )

        try:

            # =============================================
            # EMPTY RESPONSE CHECK
            # =============================================

            if not raw_response:

                raise ResponseParsingError(
                    message=(
                        "Empty response received from LLM."
                    )
                )

            # =============================================
            # SANITIZE
            # =============================================

            cleaned_response = (
                self._sanitize_response(
                    raw_response
                )
            )

            # =============================================
            # NORMALIZE UNICODE
            # =============================================

            normalized_response = (
                self._normalize_unicode(
                    cleaned_response
                )
            )

            # =============================================
            # SECURITY CHECK
            # =============================================

            self._detect_prompt_leakage(
                normalized_response
            )

            # =============================================
            # EXTRACT JSON
            # =============================================

            extracted_json = (
                self._extract_json_structure(
                    normalized_response
                )
            )

            # =============================================
            # DETECT TRUNCATION
            # =============================================

            if self._is_likely_truncated(
                extracted_json
            ):

                logger.warning(
                    "Detected truncated JSON response"
                )

                extracted_json = (
                    self._repair_partial_json(
                        extracted_json
                    )
                )

            # =============================================
            # REPAIR COMMON JSON ISSUES
            # =============================================

            repaired_json = (
                self._repair_common_json_issues(
                    extracted_json
                )
            )

            # =============================================
            # PARSE JSON
            # =============================================

            parsed_output = json.loads(
                repaired_json
            )

            # =============================================
            # VALIDATE TYPE
            # =============================================

            if not isinstance(
                parsed_output,
                expected_type,
            ):

                raise ResponseParsingError(
                    message=(
                        f"Expected response type "
                        f"{expected_type}, "
                        f"but received "
                        f"{type(parsed_output)}"
                    )
                )

            logger.info(
                "Response parsing successful"
            )

            self.observability.end_trace(
                trace=trace,
                success=True,
            )

            return parsed_output

        except Exception as error:

            logger.exception(
                "Response parsing failed",
                extra={
                    "error": str(error),
                    "response_preview": (
                        self.preview_response(
                            raw_response
                        )
                    ),
                },
            )

            self.observability.track_error(
                error_type=(
                    type(error).__name__
                ),
                error_message=str(error),
                context={
                    "module": "response_parser",
                },
            )

            self.observability.end_trace(
                trace=trace,
                success=False,
            )

            raise ResponseParsingError(
                message=(
                    "Failed to parse structured LLM response."
                ),
                metadata={
                    "error": str(error),
                },
            ) from error

    # =====================================================
    # SANITIZE RESPONSE
    # =====================================================

    def _sanitize_response(
        self,
        response: str,
    ) -> str:

        cleaned = response.strip()

        # Remove markdown code fences

        cleaned = re.sub(
            r"```json",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )

        cleaned = re.sub(
            r"```",
            "",
            cleaned,
        )

        return cleaned.strip()

    # =====================================================
    # NORMALIZE UNICODE
    # =====================================================

    def _normalize_unicode(
        self,
        response: str,
    ) -> str:

        normalized = unicodedata.normalize(
            "NFKC",
            response,
        )

        replacements = {
            "“": "\"",
            "”": "\"",
            "‘": "'",
            "’": "'",
        }

        for old, new in (
            replacements.items()
        ):

            normalized = (
                normalized.replace(
                    old,
                    new,
                )
            )

        return normalized

    # =====================================================
    # DETECT PROMPT LEAKAGE
    # =====================================================

    def _detect_prompt_leakage(
        self,
        response: str,
    ) -> None:

        lowered = response.lower()

        for pattern in (
            self.SUSPICIOUS_PATTERNS
        ):

            if re.search(
                pattern,
                lowered,
                re.IGNORECASE,
            ):

                logger.warning(
                    "Potential prompt leakage detected",
                    extra={
                        "pattern": pattern,
                    },
                )

                raise ResponseParsingError(
                    message=(
                        "Potential prompt leakage detected."
                    ),
                    metadata={
                        "pattern": pattern,
                    },
                )

    # =====================================================
    # EXTRACT JSON STRUCTURE
    # =====================================================

    def _extract_json_structure(
        self,
        response: str,
    ) -> str:

        response = response.strip()

        start_index = None
        opening_char = None

        for i, char in enumerate(response):

            if char == "{":

                start_index = i
                opening_char = "{"
                break

            if char == "[":

                start_index = i
                opening_char = "["
                break

        if start_index is None:

            raise ResponseParsingError(
                message=(
                    "No JSON structure found."
                )
            )

        stack = []

        closing_char = (
            "}"
            if opening_char == "{"
            else "]"
        )

        for i in range(
            start_index,
            len(response),
        ):

            char = response[i]

            if char == opening_char:

                stack.append(char)

            elif char == closing_char:

                if stack:
                    stack.pop()

                if not stack:

                    return response[
                        start_index : i + 1
                    ]

        return response[start_index:]

    # =====================================================
    # DETECT TRUNCATED JSON
    # =====================================================

    def _is_likely_truncated(
        self,
        text: str,
    ) -> bool:

        return (
            text.count("{")
            != text.count("}")
        ) or (
            text.count("[")
            != text.count("]")
        )

    # =====================================================
    # REPAIR PARTIAL JSON
    # =====================================================

    def _repair_partial_json(
        self,
        text: str,
    ) -> str:

        repaired = text

        open_braces = (
            repaired.count("{")
            - repaired.count("}")
        )

        open_brackets = (
            repaired.count("[")
            - repaired.count("]")
        )

        repaired += "}" * open_braces
        repaired += "]" * open_brackets

        return repaired

    # =====================================================
    # REPAIR COMMON JSON ISSUES
    # =====================================================

    def _repair_common_json_issues(
        self,
        response: str,
    ) -> str:

        repaired = response

        # Remove trailing commas

        repaired = re.sub(
            r",\s*}",
            "}",
            repaired,
        )

        repaired = re.sub(
            r",\s*]",
            "]",
            repaired,
        )

        # Remove invalid control chars

        repaired = re.sub(
            r"[\x00-\x1F]+",
            "",
            repaired,
        )

        return repaired

    # =====================================================
    # SAFE RESPONSE PREVIEW
    # =====================================================

    def preview_response(
        self,
        response: str,
        limit: int = 500,
    ) -> str:

        if not response:

            return ""

        if len(response) <= limit:

            return response

        return response[:limit] + "..."