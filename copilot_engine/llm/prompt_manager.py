# ai/llm/prompt_manager.py

import os
import logging

from pathlib import Path

from typing import (
    Dict,
    Any,
    Optional,
)

from core.exception import (
    PromptTemplateNotFoundError,
    PromptRenderingError,
)

logger = logging.getLogger(__name__)


class PromptManager:

    """
    Enterprise Prompt Manager.

    Responsibilities:
    - prompt loading
    - prompt rendering
    - variable injection
    - template validation
    - prompt versioning support
    - centralized prompt orchestration
    """

    def __init__(
        self,
        prompt_root: Optional[str] = None,
    ):

        self.prompt_root = (
            Path(prompt_root)
            if prompt_root
            else Path("ai/prompts")
        )

    # =====================================================
    # LOAD PROMPT TEMPLATE
    # =====================================================

    def load_prompt(
        self,
        prompt_path: str,
    ) -> str:

        full_path = (
            self.prompt_root / prompt_path
        )

        logger.info(
            "Loading prompt template",
            extra={
                "prompt_path": str(full_path),
            },
        )

        if not full_path.exists():

            logger.error(
                "Prompt template not found",
                extra={
                    "prompt_path": str(full_path),
                },
            )

            raise PromptTemplateNotFoundError(
                message=(
                    f"Prompt template not found: "
                    f"{full_path}"
                )
            )

        try:

            with open(
                full_path,
                "r",
                encoding="utf-8",
            ) as file:

                return file.read()

        except Exception as error:

            logger.exception(
                "Failed to load prompt template",
                extra={
                    "prompt_path": str(full_path),
                    "error": str(error),
                },
            )

            raise PromptRenderingError(
                message=(
                    "Failed to load prompt template."
                ),
                metadata={
                    "prompt_path": str(full_path),
                },
            ) from error

    # =====================================================
    # RENDER PROMPT
    # =====================================================

    def render_prompt(
        self,
        *,
        prompt_path: str,
        variables: Optional[
            Dict[str, Any]
        ] = None,
    ) -> str:

        logger.info(
            "Rendering prompt",
            extra={
                "prompt_path": prompt_path,
            },
        )

        template = self.load_prompt(
            prompt_path
        )

        variables = variables or {}

        try:

            self._validate_variables(
                template=template,
                variables=variables,
            )

            rendered_prompt = template.format(
                **variables
            )

            logger.info(
                "Prompt rendered successfully",
                extra={
                    "prompt_path": prompt_path,
                },
            )

            return rendered_prompt.strip()

        except KeyError as error:

            logger.exception(
                "Missing prompt variable",
                extra={
                    "missing_variable": str(error),
                },
            )

            raise PromptRenderingError(
                message=(
                    "Missing variable required "
                    "for prompt rendering."
                ),
                metadata={
                    "missing_variable": str(error),
                },
            ) from error

        except Exception as error:

            logger.exception(
                "Prompt rendering failed",
                extra={
                    "prompt_path": prompt_path,
                    "error": str(error),
                },
            )

            raise PromptRenderingError(
                message="Prompt rendering failed.",
                metadata={
                    "prompt_path": prompt_path,
                },
            ) from error

    # =====================================================
    # VALIDATE VARIABLES
    # =====================================================

    def _validate_variables(
        self,
        *,
        template: str,
        variables: Dict[str, Any],
    ) -> None:

        required_variables = []

        temp = template

        while "{" in temp and "}" in temp:

            start = temp.find("{")
            end = temp.find("}")

            if start == -1 or end == -1:
                break

            variable_name = temp[
                start + 1 : end
            ].strip()

            if variable_name:
                required_variables.append(
                    variable_name
                )

            temp = temp[end + 1 :]

        missing_variables = [
            variable
            for variable in required_variables
            if variable not in variables
        ]

        if missing_variables:

            logger.error(
                "Prompt variable validation failed",
                extra={
                    "missing_variables": (
                        missing_variables
                    ),
                },
            )

            raise PromptRenderingError(
                message=(
                    "Missing required prompt variables."
                ),
                metadata={
                    "missing_variables": (
                        missing_variables
                    ),
                },
            )

    # =====================================================
    # CHECK PROMPT EXISTS
    # =====================================================

    def prompt_exists(
        self,
        prompt_path: str,
    ) -> bool:

        full_path = (
            self.prompt_root / prompt_path
        )

        return full_path.exists()

    # =====================================================
    # LIST PROMPTS
    # =====================================================

    def list_prompts(self):

        prompts = []

        for file in (
            self.prompt_root.rglob("*")
        ):

            if file.is_file():

                prompts.append(
                    str(
                        file.relative_to(
                            self.prompt_root
                        )
                    )
                )

        return prompts