"""
backfill_installment_invoices.py

One-time migration:
  - Finds all admissions where hasInstallments=true in payment_installment_schedule
  - Deletes the single INV-ADM-XXXX invoice (if it exists)
  - Creates one FeeInvoice per installment slot (INV-ADM-XXXX-I01, -I02, ...)

Run once:
    python backfill_installment_invoices.py

Safe to re-run — idempotent via invoice_no check.
"""

import asyncio
import json
import uuid
from datetime import datetime, date as date_type

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# ── adjust this import to match your project ──────────────────
# from app.core.config import settings
from app.core.config import DATABASE_URL
from app.models.admission import Admission
from app.models.student import Student
from app.models.fee import FeeInvoice
# ──────────────────────────────────────────────────────────────

# engine = create_async_engine(settings.DATABASE_URL, echo=False)
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def backfill(db: AsyncSession) -> None:
    # 1. Fetch all admissions that have a payment schedule stored
    result = await db.execute(
        select(Admission).where(
            Admission.payment_installment_schedule.isnot(None)
        )
    )
    admissions: list[Admission] = result.scalars().all()

    total      = len(admissions)
    processed  = 0
    skipped    = 0
    created    = 0
    deleted    = 0

    for admission in admissions:
        # Parse the stored JSON
        try:
            payment_data = json.loads(admission.payment_installment_schedule)
        except Exception:
            skipped += 1
            continue

        has_installments  = payment_data.get("hasInstallments", False)
        installment_slots = payment_data.get("installmentSchedule", [])

        if not has_installments or not installment_slots:
            skipped += 1
            continue

        # 2. Resolve student_id for this admission
        stu_result = await db.execute(
            select(Student).where(
                Student.tenant_id    == admission.tenant_id,
                Student.admission_id == admission.id,
            )
        )
        student = stu_result.scalar_one_or_none()
        if not student:
            print(f"  [SKIP] {admission.admission_number} — no student record found")
            skipped += 1
            continue

        student_id = str(student.id)

        # 3. Delete the single INV-ADM-XXXX invoice if it exists
        single_invoice_no = f"INV-{admission.admission_number}"
        del_result = await db.execute(
            delete(FeeInvoice).where(
                FeeInvoice.tenant_id  == admission.tenant_id,
                FeeInvoice.invoice_no == single_invoice_no,
            )
        )
        if del_result.rowcount:
            deleted += del_result.rowcount
            print(f"  [DEL]  {single_invoice_no}")

        # 4. Create one FeeInvoice per installment slot
        today = datetime.now().date()
        for slot in installment_slots:
            slot_num   = slot.get("number", 1)
            invoice_no = f"INV-{admission.admission_number}-I{str(slot_num).zfill(2)}"

            # Idempotency — skip if already exists
            existing = await db.execute(
                select(FeeInvoice).where(
                    FeeInvoice.tenant_id  == admission.tenant_id,
                    FeeInvoice.invoice_no == invoice_no,
                )
            )
            if existing.scalar_one_or_none():
                print(f"  [SKIP] {invoice_no} already exists")
                continue

            slot_amount = float(slot.get("amount", 0))
            if slot_amount <= 0:
                continue

            # due_date — must be a date object
            due_date_raw = slot.get("due_date") or slot.get("dueDate")
            try:
                due_date: date_type = date_type.fromisoformat(due_date_raw)
            except Exception:
                due_date = date_type(datetime.now().year, 12, 31)

            # Per-slot status
            slot_paid   = slot.get("paid", False)
            amount_paid = slot_amount if slot_paid else 0.0
            if slot_paid:
                status = "paid"
            elif due_date < today:
                status = "overdue"
            else:
                status = "pending"

            invoice = FeeInvoice(
                id          = uuid.uuid4(),
                tenant_id   = admission.tenant_id,
                student_id  = student_id,
                invoice_no  = invoice_no,
                amount_due  = slot_amount,
                amount_paid = amount_paid,
                discount    = 0,
                due_date    = due_date,
                status      = status,
            )
            db.add(invoice)
            created += 1
            print(f"  [NEW]  {invoice_no}  due={due_date}  amt={slot_amount}  status={status}")

        processed += 1

    await db.commit()

    print("\n── Backfill complete ─────────────────────────────────")
    print(f"  Admissions scanned : {total}")
    print(f"  Admissions processed : {processed}")
    print(f"  Admissions skipped   : {skipped}")
    print(f"  Old invoices deleted : {deleted}")
    print(f"  New invoices created : {created}")


async def main() -> None:
    async with AsyncSessionLocal() as db:
        await backfill(db)


if __name__ == "__main__":
    asyncio.run(main())