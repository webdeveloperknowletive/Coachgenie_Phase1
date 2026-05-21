# database/database.py

import logging

from typing import (
    AsyncGenerator,
)

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from sqlalchemy.orm import (
    declarative_base,
)

from sqlalchemy.pool import (
    NullPool,
)

from sqlalchemy import (
    text,
)

from core.config import (
    settings,
)

from core.exception import (
    DatabaseConnectionError,
)

logger = logging.getLogger(
    __name__
)

# =========================================================
# DATABASE URL
# =========================================================

DATABASE_URL = (
    settings.DATABASE_URL
)

# =========================================================
# SQLALCHEMY BASE
# =========================================================

Base = declarative_base()

# =========================================================
# ASYNC ENGINE
# =========================================================

engine = create_async_engine(

    DATABASE_URL,

    echo=settings.DEBUG,

    future=True,

    pool_pre_ping=True,

    pool_size=settings.DB_POOL_SIZE,

    max_overflow=settings.DB_MAX_OVERFLOW,

    pool_timeout=settings.DB_POOL_TIMEOUT,

    pool_recycle=1800,

    # For serverless / special cases
    # poolclass=NullPool,

)

# =========================================================
# SESSION FACTORY
# =========================================================

AsyncSessionLocal = (
    async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )
)

# =========================================================
# DATABASE SESSION DEPENDENCY
# =========================================================

async def get_db() -> AsyncGenerator[
    AsyncSession,
    None,
]:

    """
    FastAPI DB dependency.
    """

    async with AsyncSessionLocal() as session:

        try:

            yield session

            await session.commit()

        except Exception:

            await session.rollback()

            logger.exception(
                "Database session rollback triggered"
            )

            raise

        finally:

            await session.close()

# =========================================================
# DATABASE HEALTH CHECK
# =========================================================

async def check_database_connection() -> bool:

    """
    Verify DB connectivity.
    """

    try:

        async with engine.begin() as conn:

            await conn.execute(
                text("SELECT 1")
            )

        logger.info(
            "Database connection healthy"
        )

        return True

    except Exception as error:

        logger.exception(
            "Database health check failed"
        )

        raise DatabaseConnectionError(
            message="Failed to connect to database",
            metadata={
                "error": str(error),
            },
        ) from error

# =========================================================
# DATABASE STARTUP
# =========================================================

async def init_database():

    """
    Initialize database layer.
    """

    logger.info(
        "Initializing database connection"
    )

    await check_database_connection()

# =========================================================
# DATABASE SHUTDOWN
# =========================================================

async def close_database():

    """
    Gracefully close DB engine.
    """

    logger.info(
        "Closing database engine"
    )

    await engine.dispose()