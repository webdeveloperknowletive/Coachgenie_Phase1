# copilot_engine/main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from copilot_engine.core.logging_config import (
    setup_logging,
)

from copilot_engine.middleware.request_context_middleware import (
    RequestContextMiddleware,
)

from copilot_engine.routes.copilot import (
    router as copilot_router,
)

from copilot_engine.routes.report_routes import (
    router as report_router,
)
from copilot_engine.core.config import settings

setup_logging()

app = FastAPI(
    title="Coach Genie Copilot Engine",
    docs_url=None if settings.PRODUCTION else "/docs",
    redoc_url=None if settings.PRODUCTION else "/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    RequestContextMiddleware
)

app.include_router(
    copilot_router
)

app.include_router(
    report_router
)

app.mount(
    "/generated_reports",
    StaticFiles(directory="generated_reports"),
    name="generated_reports",
)

@app.get("/health")
async def health():

    return {
        "status": "ok",
        "service": "copilot_engine",
    }