# import logging
# from contextlib import asynccontextmanager
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from app.config import settings
# from app.database import engine
# from app.routers import syllabus

# import app.models  # noqa: F401  ← must be before any router import

# from app.routers import (
#     auth, tenants, leads, students, admissions,
#     batches, attendance, exams, fees, notifications, ai
# )

# from app.routers.ai_reports import (
#     router as ai_reports_router,
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


# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     logger.error(f"Unhandled exception: {exc}", exc_info=True)
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
# app.include_router(ai_reports_router,    prefix=PREFIX)


<<<<<<< HEAD
=======
# import logging
# from contextlib import asynccontextmanager
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from app.config import settings
# from app.database import engine
# from app.scheduler import start_scheduler, scheduler

# import app.models  # noqa: F401

# from app.routers import (
#     auth, tenants, leads, students, admissions,
#     batches, attendance, exams, fees, notifications, ai,parents, tutors, admins,
# )

# from app.routers.ai_reports import (
#     router as ai_reports_router,
# )
# from app.routers import growth_cards
# from app.routers import auth_extended, dashboard
# from slowapi import Limiter
# from slowapi.util import get_remote_address
# from slowapi.middleware import SlowAPIMiddleware
# from app.routers.ai_reports import router as ai_reports_router
# from app.routers import growth_cards, auth_extended, dashboard, syllabus

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("coaching_erp")


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     logger.info(f"Starting {settings.APP_NAME}")
#     start_scheduler()
#     yield
#     scheduler.shutdown()
#     await engine.dispose()

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     logger.info(f"Starting {settings.APP_NAME}")
#     yield
#     await engine.dispose()


# app = FastAPI(
#     title=settings.APP_NAME,
#     version="1.0.0",
#     docs_url="/docs",
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",
#         "http://127.0.0.1:3000",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# limiter = Limiter(key_func=get_remote_address)

# app.state.limiter = limiter
# app.add_middleware(SlowAPIMiddleware)

# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     logger.error(f"Unhandled exception: {exc}", exc_info=True)
#     return JSONResponse(
#         status_code=500,
#         content={"success": False, "message": "Internal server error"},
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
# app.include_router(ai_reports_router,    prefix=PREFIX)
# app.include_router(syllabus.router,      prefix=PREFIX)
# app.include_router(parents.router,       prefix=PREFIX)  # ← add
# app.include_router(tutors.router,        prefix=PREFIX)  # ← add
# app.include_router(admins.router,        prefix=PREFIX)  # ← add


>>>>>>> 01191d4 (FIxes Done and testing remaining)
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine
<<<<<<< HEAD
from app.scheduler import start_scheduler, scheduler
=======
>>>>>>> 01191d4 (FIxes Done and testing remaining)

import app.models  # noqa: F401

from app.routers import (
    auth, tenants, leads, students, admissions,
<<<<<<< HEAD
    batches, attendance, exams, fees, notifications, ai,parents, tutors, admins,
)

from app.routers.ai_reports import (
    router as ai_reports_router,
)
from app.routers import growth_cards
from app.routers import auth_extended, dashboard
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from app.routers.ai_reports import router as ai_reports_router
from app.routers import growth_cards, auth_extended, dashboard, syllabus
=======
    batches, attendance, exams, fees, notifications, ai,
    parents, tutors, admins,
)
from app.routers.ai_reports import router as ai_reports_router
from app.routers import growth_cards, auth_extended, dashboard, syllabus
from app.routers import inbox_notification         # ← new

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
>>>>>>> 01191d4 (FIxes Done and testing remaining)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("coaching_erp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME}")
<<<<<<< HEAD
    start_scheduler()
    yield
    scheduler.shutdown()
    await engine.dispose()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME}")
=======
>>>>>>> 01191d4 (FIxes Done and testing remaining)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
<<<<<<< HEAD
=======
    lifespan=lifespan,
>>>>>>> 01191d4 (FIxes Done and testing remaining)
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

limiter = Limiter(key_func=get_remote_address)
<<<<<<< HEAD

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

=======
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


>>>>>>> 01191d4 (FIxes Done and testing remaining)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin":      "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        },
    )


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}


PREFIX = "/api/v1"
<<<<<<< HEAD
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
app.include_router(syllabus.router,      prefix=PREFIX)
app.include_router(parents.router,       prefix=PREFIX)  # ← add
app.include_router(tutors.router,        prefix=PREFIX)  # ← add
app.include_router(admins.router,        prefix=PREFIX)  # ← add
=======
app.include_router(tenants.router,              prefix=PREFIX)
app.include_router(auth.router,                 prefix=PREFIX)
app.include_router(leads.router,                prefix=PREFIX)
app.include_router(students.router,             prefix=PREFIX)
app.include_router(admissions.router,           prefix=PREFIX)
app.include_router(batches.router,              prefix=PREFIX)
app.include_router(attendance.router,           prefix=PREFIX)
app.include_router(exams.router,                prefix=PREFIX)
app.include_router(fees.router,                 prefix=PREFIX)
app.include_router(notifications.router,        prefix=PREFIX)
app.include_router(ai.router,                   prefix=PREFIX)
app.include_router(growth_cards.router,         prefix=PREFIX)
app.include_router(auth_extended.router,        prefix=PREFIX)
app.include_router(dashboard.router,            prefix=PREFIX)
app.include_router(ai_reports_router,           prefix=PREFIX)
app.include_router(syllabus.router,             prefix=PREFIX)
app.include_router(parents.router,              prefix=PREFIX)
app.include_router(tutors.router,               prefix=PREFIX)
app.include_router(admins.router,               prefix=PREFIX)
app.include_router(inbox_notification.router,   prefix=PREFIX)
>>>>>>> 01191d4 (FIxes Done and testing remaining)
