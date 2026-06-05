import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:

        students = await db.execute(
            text("SELECT enrollment_no, first_name, admission_id FROM students")
        )

        print("\n--- STUDENTS ---")
        for row in students:
            print(row)

        admissions = await db.execute(
            text("SELECT admission_number, status, lead_id FROM admissions")
        )

        print("\n--- ADMISSIONS ---")
        for row in admissions:
            print(row)

asyncio.run(check())