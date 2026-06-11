import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine
from app.scheduler import start_scheduler, scheduler
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware

import app.models  # noqa: F401

from app.routers import (
    auth, tenants, leads, students, admissions,
    batches, attendance, exams, fees, notifications, ai,
    parents, tutors, admins, growth_cards, auth_extended,
    dashboard, syllabus, inbox_notification,
)
from app.routers.ai_reports import router as ai_reports_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("coaching_erp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME}")
    start_scheduler()
    yield
    scheduler.shutdown()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error"},
    )


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}


PREFIX = "/api/v1"
app.include_router(tenants.router,            prefix=PREFIX)
app.include_router(auth.router,               prefix=PREFIX)
app.include_router(leads.router,              prefix=PREFIX)
app.include_router(students.router,           prefix=PREFIX)
app.include_router(admissions.router,         prefix=PREFIX)
app.include_router(batches.router,            prefix=PREFIX)
app.include_router(attendance.router,         prefix=PREFIX)
app.include_router(exams.router,              prefix=PREFIX)
app.include_router(fees.router,               prefix=PREFIX)
app.include_router(notifications.router,      prefix=PREFIX)
app.include_router(ai.router,                 prefix=PREFIX)
app.include_router(growth_cards.router,       prefix=PREFIX)
app.include_router(auth_extended.router,      prefix=PREFIX)
app.include_router(dashboard.router,          prefix=PREFIX)
app.include_router(ai_reports_router,         prefix=PREFIX)
app.include_router(syllabus.router,           prefix=PREFIX)
app.include_router(parents.router,            prefix=PREFIX)
app.include_router(tutors.router,             prefix=PREFIX)
app.include_router(admins.router,             prefix=PREFIX)
app.include_router(inbox_notification.router, prefix=PREFIX)