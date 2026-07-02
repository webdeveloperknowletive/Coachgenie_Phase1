import asyncio
import os
from datetime import date, timedelta

from sqlalchemy import select
from passlib.context import CryptContext
from dotenv import load_dotenv

from app.database import AsyncSessionLocal
from app.models.tenant import Tenant
from app.models.user import User
from app.models.batch import Subject, Batch, BatchStudent
from app.services import admission as admission_service
from app.services import lead as lead_service

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# ── helpers ────────────────────────────────────────────────────────────────────

async def get_or_create_tenant(db) -> Tenant:
    result = await db.execute(
        select(Tenant).where(Tenant.subdomain == "demo")
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        tenant = Tenant(
            name="Demo Coaching Institute",
            subdomain="demo",
            plan="pro",
            is_active=True,
            settings={"theme": "blue", "locale": "en-IN"},
        )
        db.add(tenant)
        await db.flush()
        print(f"  [+] Tenant: {tenant.name}")
    return tenant


async def get_or_create_users(db, tenant_id: str) -> dict:
    users_data = [
        {"email": "owner@demo.com",      "role": "owner",      "first": "Demo",   "last": "Owner"},
        {"email": "counselor@demo.com",  "role": "counselor",  "first": "Priya",  "last": "Sharma"},
        {"email": "tutor@demo.com",      "role": "tutor",      "first": "Rahul",  "last": "Verma"},
    ]
    created = {}
    for u in users_data:
        result = await db.execute(
            select(User).where(User.email == u["email"], User.tenant_id == tenant_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                tenant_id=tenant_id,
                email=u["email"],
                password_hash=hash_password("Admin@1234"),
                role=u["role"],
                first_name=u["first"],
                last_name=u["last"],
                is_active=True,
            )
            db.add(user)
            await db.flush()
            print(f"  [+] User: {u['email']} ({u['role']})")
        created[u["role"]] = user
    return created


async def get_or_create_batch(db, tenant_id: str) -> Batch:
    result = await db.execute(
        select(Batch).where(Batch.name == "JEE 2026", Batch.tenant_id == tenant_id)
    )
    batch = result.scalar_one_or_none()
    if not batch:
        batch = Batch(
            tenant_id=tenant_id,
            name="JEE 2026",
            code="JEE26",
            target_exam="JEE Main & Advanced",
            academic_year="2025-26",
            start_date=date(2025, 6, 1),
            end_date=date(2026, 5, 31),
            capacity=60,
            is_active=True,
        )
        db.add(batch)
        await db.flush()
        print(f"  [+] Batch: {batch.name}")
    return batch


async def enroll_student_in_batch(db, batch_id, student_id):
    result = await db.execute(
        select(BatchStudent).where(
            BatchStudent.batch_id == batch_id,
            BatchStudent.student_id == student_id,
        )
    )
    if not result.scalar_one_or_none():
        db.add(BatchStudent(
            batch_id=batch_id,
            student_id=student_id,
            enrolled_at=date.today(),
        ))
        await db.flush()


# ── Path A: Lead → Convert → Admission → Student ───────────────────────────────

async def seed_lead_path(db, tenant_id: str, users: dict, batch) -> None:
    print("\n  [Path A] Lead → convert → student")

    # Check if already seeded
    from app.models.lead import Lead
    from sqlalchemy import and_
    existing = await db.execute(
        select(Lead).where(
            and_(
                Lead.tenant_id == tenant_id,
                Lead.phone == "9876540001",
            )
        )
    )
    if existing.scalar_one_or_none():
        print("  [skip] Lead path already seeded.")
        return

    # 1. Create lead (via service — same as POST /leads/)
    lead = await lead_service.create_lead(db, tenant_id, {
        "full_name":         "Arjun Singh",
        "phone":             "9876540001",
        "email":             "arjun.singh@demo.com",
        "source":            "website",
        "status":            "new",
        "interested_course": "JEE Main & Advanced",
        "grade":             "12th",
        "school_name":       "Delhi Public School",
        "parent_name":       "Suresh Singh",
        "parent_contact_number": "9876540002",
        "board_name":        "CBSE",
        "batch_id":          str(batch.id),
        "assigned_to":       str(users["counselor"].id),
        "notes":             "Interested in JEE coaching.",
    })
    print(f"  [+] Lead created: {lead.full_name} (id={lead.id})")

    # 2. Log a follow-up activity
    await lead_service.add_activity(db, tenant_id, str(lead.id), str(users["counselor"].id), {
        "type":        "call",
        "description": "Initial call done. Student interested. Follow-up in 3 days.",
    })

    # 3. Change stage to interested
    await lead_service.update_lead(db, tenant_id, str(lead.id), {"status": "interested"})

    # 4. Convert lead → admission → student (single atomic service call)
    admission, student = await admission_service.convert_lead(
        db,
        tenant_id    = tenant_id,
        lead_id      = str(lead.id),
        converted_by = str(users["owner"].id),
        admission_data = {
            "applied_course": "JEE Main & Advanced",
            "academic_year":  "2025-26",
            "remarks":        "Converted from website lead.",
        },
    )
    print(f"  [+] Admission: {admission.admission_number} (status={admission.status})")
    print(f"  [+] Student:   {student.enrollment_no} — {student.first_name} {student.last_name}")
    print(f"       lead_id on admission: {admission.lead_id}  ← not null (lead path)")

    # 5. Enroll in batch
    await enroll_student_in_batch(db, batch.id, student.id)
    print(f"  [+] Enrolled in batch: {batch.name}")


# ── Path B: Walk-in → Direct Admission → Student ──────────────────────────────

async def seed_walkin_path(db, tenant_id: str, users: dict, batch) -> None:
    print("\n  [Path B] Walk-in → direct admission → student")

    # Check if already seeded
    from app.models.admission import Admission
    from sqlalchemy import and_
    existing = await db.execute(
        select(Admission).where(
            and_(
                Admission.tenant_id == tenant_id,
                Admission.phone == "9876540099",
                Admission.lead_id == None,
            )
        )
    )
    if existing.scalar_one_or_none():
        print("  [skip] Walk-in path already seeded.")
        return

    # 1. Create admission directly (no lead — walk-in)
    admission = await admission_service.create_admission(db, tenant_id, {
        "student_name":  "Meera Patel",
        "phone":         "9876540099",
        "email":         "meera.patel@demo.com",
        "parent_name":   "Rakesh Patel",
        "parent_phone":  "9876540098",
        "school_name":   "Ryan International School",
        "grade":         "11th",
        "board_name":    "CBSE",
        "applied_course": "JEE Main & Advanced",
        "academic_year": "2025-26",
        "status":        "PENDING_DOCS",
        "remarks":       "Walk-in at institute. Father accompanied.",
        # lead_id is intentionally absent — this is the walk-in path
    })
    print(f"  [+] Admission created: {admission.admission_number} (lead_id=None ← walk-in path)")

    # 2. Approve admission
    admission = await admission_service.approve_admission(
        db, tenant_id, str(admission.id), str(users["owner"].id)
    )
    print(f"  [+] Admission approved: status={admission.status}")

    # 3. Generate student (same function as lead path — identical output)
    student = await admission_service.generate_student_from_admission(db, admission)
    print(f"  [+] Student:   {student.enrollment_no} — {student.first_name} {student.last_name}")
    print(f"       lead_id on admission: {admission.lead_id}  ← None (walk-in path)")

    # 4. Enroll in batch
    await enroll_student_in_batch(db, batch.id, student.id)
    print(f"  [+] Enrolled in batch: {batch.name}")


# ── Main ───────────────────────────────────────────────────────────────────────

async def seed():
    print("\nSeeding CoachGenie...\n")

    async with AsyncSessionLocal() as db:
        tenant = await get_or_create_tenant(db)
        users  = await get_or_create_users(db, str(tenant.id))
        batch  = await get_or_create_batch(db, str(tenant.id))

        await seed_lead_path(db, str(tenant.id), users, batch)
        await seed_walkin_path(db, str(tenant.id), users, batch)

        await db.commit()

    print("\nSeed complete!")
    print("─" * 40)
    print("  owner@demo.com      / Admin@1234")
    print("  counselor@demo.com  / Admin@1234")
    print("  tutor@demo.com      / Admin@1234")
    print("  Header: X-Tenant-Subdomain: demo")
    print("\nTwo students created:")
    print("  Arjun Singh  — via lead conversion (admission.lead_id is set)")
    print("  Meera Patel  — via walk-in (admission.lead_id is NULL)")
    print("─" * 40)

# if os.getenv("ENVIRONMENT") != "development":
#     raise Exception("Seed disabled outside development")
ALLOW_SEED = os.getenv("ALLOW_SEED", "false").lower() == "true"

if not ALLOW_SEED:
    raise Exception("Seed disabled. Set ALLOW_SEED=true to run.")

if __name__ == "__main__":
    asyncio.run(seed())
