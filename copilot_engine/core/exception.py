# core/exceptions.py

from typing import (
    Optional,
    Dict,
    Any,
)


# =========================================================
# BASE APPLICATION EXCEPTION
# =========================================================

class CoachGenieException(Exception):

    """
    Base exception for entire platform.

    All custom exceptions should inherit from this.
    """

    def __init__(
        self,
        message: str,
        *,
        error_code: Optional[str] = None,
        status_code: int = 500,
        metadata: Optional[Dict[str, Any]] = None,
    ):

        self.message = message

        self.error_code = (
            error_code
            or self.__class__.__name__
        )

        self.status_code = status_code

        self.metadata = (
            metadata or {}
        )

        super().__init__(message)

    def to_dict(self) -> Dict[str, Any]:

        return {
            "error": self.error_code,
            "message": self.message,
            "status_code": self.status_code,
            "metadata": self.metadata,
        }


# =========================================================
# VALIDATION EXCEPTIONS
# =========================================================

class ValidationException(
    CoachGenieException
):

    """
    Generic validation exception.
    """

    def __init__(
        self,
        message: str = "Validation failed",
        *,
        metadata: Optional[
            Dict[str, Any]
        ] = None,
    ):

        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=400,
            metadata=metadata,
        )


class InputValidationError(
    ValidationException
):

    """
    Raised when user input fails validation.
    """

    pass


class OutputValidationError(
    ValidationException
):

    """
    Raised when AI output validation fails.
    """

    pass


class SchemaValidationError(
    ValidationException
):

    """
    Raised when schema validation fails.
    """

    pass


# =========================================================
# SECURITY EXCEPTIONS
# =========================================================

class SecurityException(
    CoachGenieException
):

    """
    Base security exception.
    """

    def __init__(
        self,
        message: str = "Security violation detected",
        *,
        metadata: Optional[
            Dict[str, Any]
        ] = None,
    ):

        super().__init__(
            message=message,
            error_code="SECURITY_ERROR",
            status_code=403,
            metadata=metadata,
        )


class PromptInjectionError(
    SecurityException
):

    """
    Raised when prompt injection is detected.
    """

    pass


class UnauthorizedAccessError(
    SecurityException
):

    """
    Raised when unauthorized access occurs.
    """

    pass


class PermissionDeniedError(
    SecurityException
):

    """
    Raised when permissions are insufficient.
    """

    pass


# =========================================================
# AGENT EXCEPTIONS
# =========================================================

class AgentException(
    CoachGenieException
):

    """
    Base AI agent exception.
    """

    def __init__(
        self,
        message: str = "Agent execution failed",
        *,
        metadata: Optional[
            Dict[str, Any]
        ] = None,
    ):

        super().__init__(
            message=message,
            error_code="AGENT_ERROR",
            status_code=500,
            metadata=metadata,
        )


class AgentExecutionError(
    AgentException
):

    """
    Raised when agent execution fails.
    """

    pass


class ToolExecutionError(
    AgentException
):

    """
    Raised when tool execution fails.
    """

    pass


class PromptGenerationError(
    AgentException
):

    """
    Raised when prompt generation fails.
    """

    pass


# =========================================================
# LLM EXCEPTIONS
# =========================================================

class LLMException(
    CoachGenieException
):

    """
    Base LLM exception.
    """

    def __init__(
        self,
        message: str = "LLM operation failed",
        *,
        metadata: Optional[
            Dict[str, Any]
        ] = None,
    ):

        super().__init__(
            message=message,
            error_code="LLM_ERROR",
            status_code=500,
            metadata=metadata,
        )


class ProviderNotFoundError(
    LLMException
):

    """
    Raised when provider is missing.
    """

    pass


class ProviderTimeoutError(
    LLMException
):

    """
    Raised on LLM timeout.
    """

    pass


class RateLimitExceededError(
    LLMException
):

    """
    Raised when provider rate limit hits.
    """

    pass


class StructuredOutputGenerationError(
    LLMException
):

    """
    Raised when structured output fails.
    """

    pass


class InvalidLLMResponseError(
    LLMException
):

    """
    Raised when malformed LLM response received.
    """

    pass


# =========================================================
# DATABASE EXCEPTIONS
# =========================================================

class DatabaseException(
    CoachGenieException
):

    """
    Base database exception.
    """

    def __init__(
        self,
        message: str = "Database operation failed",
        *,
        metadata: Optional[
            Dict[str, Any]
        ] = None,
    ):

        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            status_code=500,
            metadata=metadata,
        )


class DatabaseConnectionError(
    DatabaseException
):

    """
    Raised when DB connection fails.
    """

    pass


class DatabaseOperationError(
    DatabaseException
):

    """
    Raised when DB operation fails.
    """

    pass


class RecordNotFoundError(
    DatabaseException
):

    """
    Raised when record not found.
    """

    def __init__(
        self,
        message: str = "Record not found",
        *,
        metadata: Optional[
            Dict[str, Any]
        ] = None,
    ):

        super().__init__(
            message=message,
            metadata=metadata,
        )

        self.status_code = 404


# =========================================================
# SERVICE EXCEPTIONS
# =========================================================

class ServiceException(
    CoachGenieException
):

    """
    Base service layer exception.
    """

    pass


class ExternalAPIError(
    ServiceException
):

    """
    Raised when external API fails.
    """

    pass


class BackendServiceError(
    ServiceException
):

    """
    Raised when backend service fails.
    """

    pass


# =========================================================
# REPORT EXCEPTIONS
# =========================================================

class ReportException(
    CoachGenieException
):

    """
    Base report exception.
    """

    pass


class ReportGenerationError(
    ReportException
):

    """
    Raised when report generation fails.
    """

    pass


class ReportExportError(
    ReportException
):

    """
    Raised when report export fails.
    """

    pass