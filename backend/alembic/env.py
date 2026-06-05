from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Import ALL models so Alembic detects every table ─────────
from app.database import Base
import app.models  # noqa: F401 — registers all models

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

import os
from dotenv import load_dotenv

load_dotenv()

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)  # ✅ logging init first

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL is not set in environment / .env file")

database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")

config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))

# ... rest of your env.py (target_metadata, run_migrations_offline, etc.)

def run_migrations_offline() -> None:
    """Run migrations without a live DB connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# def run_migrations_online() -> None:
    """Run migrations with a live DB connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

def run_migrations_online() -> None:
    """Run migrations with correct DB connection."""

    DATABASE_URL = os.getenv("DATABASE_URL")

    # Convert async URL → sync (VERY IMPORTANT for Alembic)
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "")

    connectable = create_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
