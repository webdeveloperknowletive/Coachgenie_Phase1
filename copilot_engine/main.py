from fastapi import FastAPI

from core.logging_config import (
    setup_logging,
)

from middleware.request_context_middleware import (
    RequestContextMiddleware
)

from routes.report_routes import (
    router as report_router
)

from routes.copilot import (
    router as copilot_router
)


setup_logging()

app = FastAPI()

app.add_middleware(RequestContextMiddleware)

app.include_router(report_router)

app.include_router(
    copilot_router
)