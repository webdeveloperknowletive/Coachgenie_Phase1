import asyncio
from app.database import engine
from sqlalchemy import text

async def fix():
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE alembic_version SET version_num = '1631330d5b10'"))
        print('Done')

asyncio.run(fix())
