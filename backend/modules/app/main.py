import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine

# Routers
from app.routers import (
    auth, tenants, leads, students, admissions,
    batches, attendance, exams, fees, notifications, ai
)
from app.routers import growth_cards

# Logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("coaching_erp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 {settings.APP_NAME} starting up...")
    yield
    logger.info("👋 Shutting down...")
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Coaching Institute ERP - REST API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# app.add_middleware(
#     CORSMiddleware,
#     # allow_origins=settings.origins_list,
#     allow_origins=settings.ALLOWED_ORIGINS.split(","),
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
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



@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": str(exc) if settings.DEBUG else "Internal server error",
        },
    )


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}


# ── Register all routers ──────────────────────────────────────
PREFIX = "/api/v1"

# Phase 1 & 2
app.include_router(tenants.router,       prefix=PREFIX)
app.include_router(auth.router,          prefix=PREFIX)
app.include_router(leads.router,         prefix=PREFIX)
app.include_router(students.router,      prefix=PREFIX)
app.include_router(admissions.router,    prefix=PREFIX)
app.include_router(batches.router,       prefix=PREFIX)
app.include_router(attendance.router,    prefix=PREFIX)
app.include_router(exams.router,         prefix=PREFIX)
app.include_router(fees.router,          prefix=PREFIX)

# Phase 3
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(ai.router,            prefix=PREFIX)
app.include_router(growth_cards.router,  prefix=PREFIX)
