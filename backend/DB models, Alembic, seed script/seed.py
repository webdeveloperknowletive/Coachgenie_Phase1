"""
Seed Script — Creates all initial data for CoachingERP
Run once after migrations:  python seed.py

Creates:
  - 1 Tenant (Demo Coaching Institute)
  - 4 Users  (owner, counselor, tutor, student)
  - 3 Subjects (Mathematics, Physics, Chemistry)
  - 1 Batch   (JEE 2025)
  - 1 Student  (linked to student user)
  - 1 Fee Structure
  - 1 Notification Template
"""

import asyncio
from datetime import date
from app.database import AsyncSessionLocal
from app.models.tenant import Tenant
from app.models.user import User
from app.models.student import Student
from app.models.batch import Subject, Batch, BatchStudent
from app.models.fee import FeeStructure
from app.models.notification import NotificationTemplate
from sqlalchemy import select
import hashlib
import bcrypt
from dotenv import load_dotenv

load_dotenv()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


async def seed():
    print("\n🌱 Starting CoachingERP seed...\n")

    async with AsyncSessionLocal() as db:

        # ── 1. TENANT ─────────────────────────────────────────
        result = await db.execute(select(Tenant).where(Tenant.subdomain == "demo"))
        tenant = result.scalar_one_or_none()

        if not tenant:
            tenant = Tenant(
                name="Demo Coaching Institute",
                subdomain="demo",
                plan="pro",
                is_active=True,
                settings={
                    "theme": "blue",
                    "locale": "en-IN",
                    "currency": "INR",
                },
            )
            db.add(tenant)
            await db.flush()
            print(f"✅ Tenant     : {tenant.name}  (subdomain={tenant.subdomain})")
        else:
            print(f"ℹ️  Tenant already exists: {tenant.name}")

        # ── 2. USERS ──────────────────────────────────────────
        users_data = [
            {"email": "owner@demo.com",      "role": "owner",     "first": "Demo",   "last": "Owner"},
            {"email": "counselor@demo.com",  "role": "counselor", "first": "Priya",  "last": "Sharma"},
            {"email": "tutor@demo.com",      "role": "tutor",     "first": "Rahul",  "last": "Verma"},
            {"email": "student@demo.com",    "role": "student",   "first": "Arjun",  "last": "Singh"},
            {"email": "parent@demo.com",     "role": "parent",    "first": "Suresh", "last": "Singh"},
        ]

        created_users = {}
        for u in users_data:
            result = await db.execute(
                select(User).where(User.email == u["email"], User.tenant_id == tenant.id)
            )
            user = result.scalar_one_or_none()
            if not user:
                user = User(
                    tenant_id=tenant.id,
                    email=u["email"],
                    password_hash=hash_password("Admin@1234"),
                    role=u["role"],
                    first_name=u["first"],
                    last_name=u["last"],
                    is_active=True,
                )
                db.add(user)
                await db.flush()
                print(f"✅ User       : {u['email']}  (role={u['role']})")
            else:
                print(f"ℹ️  User exists : {u['email']}")
            created_users[u["role"]] = user

        # ── 3. SUBJECTS ───────────────────────────────────────
        subjects_data = [
            {"name": "Mathematics", "code": "MATH"},
            {"name": "Physics",     "code": "PHY"},
            {"name": "Chemistry",   "code": "CHEM"},
        ]

        created_subjects = {}
        for s in subjects_data:
            result = await db.execute(
                select(Subject).where(Subject.name == s["name"], Subject.tenant_id == tenant.id)
            )
            subject = result.scalar_one_or_none()
            if not subject:
                subject = Subject(tenant_id=tenant.id, name=s["name"], code=s["code"])
                db.add(subject)
                await db.flush()
                print(f"✅ Subject    : {s['name']}")
            created_subjects[s["name"]] = subject

        # ── 4. BATCH ──────────────────────────────────────────
        result = await db.execute(
            select(Batch).where(Batch.name == "JEE 2025", Batch.tenant_id == tenant.id)
        )
        batch = result.scalar_one_or_none()
        if not batch:
            batch = Batch(
                tenant_id=tenant.id,
                name="JEE 2025",
                code="JEE25",
                target_exam="JEE Main & Advanced",
                academic_year="2024-25",
                start_date=date(2024, 6, 1),
                end_date=date(2025, 5, 31),
                capacity=60,
                is_active=True,
            )
            db.add(batch)
            await db.flush()
            print(f"✅ Batch      : {batch.name}")

        # ── 5. STUDENT ────────────────────────────────────────
        result = await db.execute(
            select(Student).where(Student.enrollment_no == "STU001", Student.tenant_id == tenant.id)
        )
        student = result.scalar_one_or_none()
        if not student:
            student = Student(
                tenant_id=tenant.id,
                user_id=created_users["student"].id,
                enrollment_no="STU001",
                first_name="Arjun",
                last_name="Singh",
                email="student@demo.com",
                phone="9876543210",
                gender="male",
                current_class="12th",
                target_exam="JEE Main & Advanced",
                school_name="Delhi Public School",
                parent_name="Suresh Singh",
                parent_phone="9876543211",
                parent_email="parent@demo.com",
                city="Delhi",
                state="Delhi",
                joined_at=date(2024, 6, 1),
                is_active=True,
            )
            db.add(student)
            await db.flush()
            print(f"✅ Student    : {student.first_name} {student.last_name} (enrollment={student.enrollment_no})")

            # Enroll student in batch
            enrollment = BatchStudent(
                batch_id=batch.id,
                student_id=student.id,
                enrolled_at=date(2024, 6, 1),
            )
            db.add(enrollment)
            await db.flush()
            print(f"✅ Enrolled   : {student.first_name} → {batch.name}")

        # ── 6. FEE STRUCTURE ──────────────────────────────────
        result = await db.execute(
            select(FeeStructure).where(
                FeeStructure.name == "JEE Annual Fee",
                FeeStructure.tenant_id == tenant.id
            )
        )
        fee_structure = result.scalar_one_or_none()
        if not fee_structure:
            fee_structure = FeeStructure(
                tenant_id=tenant.id,
                batch_id=batch.id,
                name="JEE Annual Fee",
                total_amount=75000.00,
                installments=3,
                description="Annual fee for JEE 2025 batch — payable in 3 installments",
                is_active=True,
            )
            db.add(fee_structure)
            await db.flush()
            print(f"✅ Fee        : {fee_structure.name} (₹{fee_structure.total_amount})")

        # ── 7. NOTIFICATION TEMPLATE ──────────────────────────
        result = await db.execute(
            select(NotificationTemplate).where(
                NotificationTemplate.name == "Fee Due Reminder",
                NotificationTemplate.tenant_id == tenant.id
            )
        )
        template = result.scalar_one_or_none()
        if not template:
            template = NotificationTemplate(
                tenant_id=tenant.id,
                name="Fee Due Reminder",
                channel="whatsapp",
                body="Dear {{student_name}}, your fee of ₹{{amount}} is due on {{due_date}}. Please pay at the earliest. - {{institute_name}}",
                variables=["student_name", "amount", "due_date", "institute_name"],
                is_active=True,
            )
            db.add(template)
            await db.flush()
            print(f"✅ Template   : {template.name} ({template.channel})")

        await db.commit()

    # ── Summary ───────────────────────────────────────────────
    print("\n" + "─" * 50)
    print("🎉 Seed complete! Here are your login credentials:")
    print("─" * 50)
    print("  Header for ALL API calls: X-Tenant-Subdomain: demo")
    print("─" * 50)
    print("  ROLE        EMAIL                   PASSWORD")
    print("  owner     → owner@demo.com         → Admin@1234")
    print("  counselor → counselor@demo.com     → Admin@1234")
    print("  tutor     → tutor@demo.com         → Admin@1234")
    print("  student   → student@demo.com       → Admin@1234")
    print("  parent    → parent@demo.com        → Admin@1234")
    print("─" * 50)
    print("  API Docs  → http://localhost:8000/docs")
    print("  Health    → http://localhost:8000/health")
    print("─" * 50 + "\n")


if __name__ == "__main__":
    asyncio.run(seed())
