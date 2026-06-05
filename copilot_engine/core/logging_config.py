# core/logging_config.py

import sys
import json
import uuid
import logging

from datetime import datetime, timezone
from contextvars import ContextVar

# =========================================================
# REQUEST CONTEXT VARIABLES
# =========================================================

request_id_context: ContextVar[str] = (
    ContextVar(
        "request_id",
        default="unknown",
    )
)

trace_id_context: ContextVar[str] = (
    ContextVar(
        "trace_id",
        default="unknown",
    )
)

user_id_context: ContextVar[str] = (
    ContextVar(
        "user_id",
        default="anonymous",
    )
)

# =========================================================
# JSON FORMATTER
# =========================================================

class JsonLogFormatter(
    logging.Formatter
):

    """
    Structured JSON logger.
    """

    def format(
        self,
        record: logging.LogRecord,
    ) -> str:

        log_record = {

            # =============================================
            # BASIC INFO
            # =============================================

            "timestamp": (
                datetime.now(timezone.utc).isoformat()
            ),

            "level": (
                record.levelname
            ),

            "logger": (
                record.name
            ),

            "message": (
                record.getMessage()
            ),

            # =============================================
            # TRACEABILITY
            # =============================================

            "request_id": (
                request_id_context.get()
            ),

            "trace_id": (
                trace_id_context.get()
            ),

            "user_id": (
                user_id_context.get()
            ),

            # =============================================
            # SOURCE INFO
            # =============================================

            "module": (
                record.module
            ),

            "function": (
                record.funcName
            ),

            "line": (
                record.lineno
            ),
        }

        # =============================================
        # INCLUDE EXTRA FIELDS
        # =============================================

        reserved_keys = {
            "name",
            "msg",
            "args",
            "levelname",
            "levelno",
            "pathname",
            "filename",
            "module",
            "exc_info",
            "exc_text",
            "stack_info",
            "lineno",
            "funcName",
            "created",
            "msecs",
            "relativeCreated",
            "thread",
            "threadName",
            "processName",
            "process",
        }

        for key, value in (
            record.__dict__.items()
        ):

            if key not in reserved_keys:

                try:

                    json.dumps(value)

                    log_record[key] = value

                except TypeError:

                    log_record[key] = str(
                        value
                    )

        # =============================================
        # EXCEPTION INFO
        # =============================================

        if record.exc_info:

            log_record["exception"] = (
                self.formatException(
                    record.exc_info
                )
            )

        return json.dumps(
            log_record
        )

# =========================================================
# SETUP LOGGING
# =========================================================

def setup_logging():

    """
    Configure global logging system.
    """

    root_logger = logging.getLogger()

    root_logger.setLevel(
        logging.INFO
    )

    # Remove duplicate handlers

    if root_logger.handlers:

        root_logger.handlers.clear()

    # =====================================================
    # CONSOLE HANDLER
    # =====================================================

    console_handler = (
        logging.StreamHandler(
            sys.stdout
        )
    )

    console_handler.setLevel(
        logging.INFO
    )

    console_handler.setFormatter(
        JsonLogFormatter()
    )

    root_logger.addHandler(
        console_handler
    )

    # =====================================================
    # REDUCE NOISY LIBRARIES
    # =====================================================

    logging.getLogger(
        "httpx"
    ).setLevel(
        logging.WARNING
    )

    logging.getLogger(
        "uvicorn.access"
    ).setLevel(
        logging.WARNING
    )

    logging.getLogger(
        "asyncio"
    ).setLevel(
        logging.WARNING
    )

    logger = logging.getLogger(
        __name__
    )

    logger.info(
        "Logging configured successfully"
    )

# =========================================================
# REQUEST CONTEXT HELPERS
# =========================================================

def set_request_context(
    *,
    request_id: str,
    trace_id: str,
    user_id: str,
):

    """
    Set request-scoped logging context.
    """

    request_id_context.set(
        request_id
    )

    trace_id_context.set(
        trace_id
    )

    user_id_context.set(
        user_id
    )

def clear_request_context():

    """
    Reset request context.
    """

    request_id_context.set(
        "unknown"
    )

    trace_id_context.set(
        "unknown"
    )

    user_id_context.set(
        "anonymous"
    )

# =========================================================
# GENERATE TRACE IDS
# =========================================================

def generate_request_id() -> str:

    return str(
        uuid.uuid4()
    )

def generate_trace_id() -> str:

    return str(
        uuid.uuid4()
    )