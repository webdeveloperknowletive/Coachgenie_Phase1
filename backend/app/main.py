# import logging
# from contextlib import asynccontextmanager
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from app.config import settings
# from app.database import engine
# from app.routers import (
#     auth, tenants, leads, students, admissions,
#     batches, attendance, exams, fees, notifications, ai
# )
# from app.routers import growth_cards
# from app.routers import auth_extended, dashboard



# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("coaching_erp")

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     logger.info(f"Starting {settings.APP_NAME}")
#     yield
#     await engine.dispose()

# # app = FastAPI(title=settings.APP_NAME, version="1.0.0", docs_url="/docs", lifespan=lifespan)

# # app.add_middleware(CORSMiddleware, allow_origins=settings.origins_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*", "X-Tenant-Subdomain"])

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # your Next.js origin
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # @app.exception_handler(Exception)
# # async def global_exception_handler(request: Request, exc: Exception):
# #     return JSONResponse(status_code=500, content={"success": False, "message": str(exc) if settings.DEBUG else "Internal server error"})
# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     logger.error(f"Unhandled exception: {exc}", exc_info=True)  # ← logs full traceback
#     return JSONResponse(
#         status_code=500,
#         content={"success": False, "message": str(exc) if settings.DEBUG else "Internal server error"},
#         headers={
#             "Access-Control-Allow-Origin":      "http://localhost:3000",
#             "Access-Control-Allow-Credentials": "true",
#         },
#     )

# @app.get("/health")
# async def health():
#     return {"status": "ok", "app": settings.APP_NAME}

# PREFIX = "/api/v1"
# app.include_router(tenants.router,       prefix=PREFIX)
# app.include_router(auth.router,          prefix=PREFIX)
# app.include_router(leads.router,         prefix=PREFIX)
# app.include_router(students.router,      prefix=PREFIX)
# app.include_router(admissions.router,    prefix=PREFIX)
# app.include_router(batches.router,       prefix=PREFIX)
# app.include_router(attendance.router,    prefix=PREFIX)
# app.include_router(exams.router,         prefix=PREFIX)
# app.include_router(fees.router,          prefix=PREFIX)
# app.include_router(notifications.router, prefix=PREFIX)
# app.include_router(ai.router,            prefix=PREFIX)
# app.include_router(growth_cards.router,  prefix=PREFIX)
# app.include_router(auth_extended.router, prefix=PREFIX)
# app.include_router(dashboard.router,     prefix=PREFIX)


import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine

# ✅ FIX: Import all models first so SQLAlchemy's relationship registry
# resolves all string references (e.g. "BatchStudent", "Student", "Batch")
# before any router imports trigger mapper configuration.
# Without this, routers load models in unpredictable order → circular reference.
import app.models  # noqa: F401  ← must be before any router import

from app.routers import (
    auth, tenants, leads, students, admissions,
    batches, attendance, exams, fees, notifications, ai
)

from app.routers.ai_reports import (
    router as ai_reports_router,
)
from app.routers import growth_cards
from app.routers import auth_extended, dashboard


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("coaching_erp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME}")
    yield
    await engine.dispose()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": str(exc) if settings.DEBUG else "Internal server error"},
        headers={
            "Access-Control-Allow-Origin":      "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        },
    )


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}


PREFIX = "/api/v1"
app.include_router(tenants.router,       prefix=PREFIX)
app.include_router(auth.router,          prefix=PREFIX)
app.include_router(leads.router,         prefix=PREFIX)
app.include_router(students.router,      prefix=PREFIX)
app.include_router(admissions.router,    prefix=PREFIX)
app.include_router(batches.router,       prefix=PREFIX)
app.include_router(attendance.router,    prefix=PREFIX)
app.include_router(exams.router,         prefix=PREFIX)
app.include_router(fees.router,          prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(ai.router,            prefix=PREFIX)
app.include_router(growth_cards.router,  prefix=PREFIX)
app.include_router(auth_extended.router, prefix=PREFIX)
app.include_router(dashboard.router,     prefix=PREFIX)
app.include_router(ai_reports_router,    prefix=PREFIX)