# ai/exceptions/backend_exceptions.py


class BackendClientError(Exception):
    """Base backend client exception."""


class BackendAuthenticationError(
    BackendClientError
):
    """Authentication failure."""


class BackendAuthorizationError(
    BackendClientError
):
    """Authorization failure."""


class BackendTimeoutError(
    BackendClientError
):
    """Timeout failure."""


class BackendConnectionError(
    BackendClientError
):
    """Connection failure."""


class BackendResponseError(
    BackendClientError
):
    """Backend response failure."""