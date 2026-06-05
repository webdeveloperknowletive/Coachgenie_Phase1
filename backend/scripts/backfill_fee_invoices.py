import asyncio
from datetime import date
from sqlalchemy import select
from app.database import AsyncSessionLocal  # adjust if your session factory has a different name
from app.models.admission import Admission
from app.models.fee import FeeInvoice
import uuid, json

async def backfill():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Admission).where(Admission.fee_amount > 0)
        )
        admissions = result.scalars().all()
        created, skipped = 0, 0

        for adm in admissions:
            invoice_no = f"INV-{adm.admission_number}"

            existing = await db.execute(
                select(FeeInvoice).where(
                    FeeInvoice.tenant_id  == adm.tenant_id,
                    FeeInvoice.invoice_no == invoice_no,
                )
            )
            if existing.scalar_one_or_none():
                skipped += 1
                continue

            # if not adm.student_id:
            #     from app.models.student import Student
            #     stu = await db.execute(
            #         select(Student).where(
            #             Student.tenant_id    == adm.tenant_id,
            #             Student.admission_id == adm.id,
            #         )
            #     )
            #     stu = stu.scalar_one_or_none()
            #     student_id = str(stu.id) if stu else None
            # else:
            #     student_id = str(adm.student_id)
            from app.models.student import Student
            stu = await db.execute(
                select(Student).where(
                    Student.tenant_id    == adm.tenant_id,
                    Student.admission_id == adm.id,
                )
            )
            stu = stu.scalar_one_or_none()
            student_id = str(stu.id) if stu else None

            if not student_id:
                print(f"SKIP {invoice_no} — no student linked")
                skipped += 1
                continue

            fee_amount = float(adm.fee_amount or 0)
            fee_paid   = float(adm.fee_paid   or 0)

            if fee_paid >= fee_amount:
                status = "paid"
            elif fee_paid > 0:
                status = "partial"
            else:
                status = "pending"

            due_date = date(date.today().year, 12, 31)
            if adm.payment_installment_schedule:
                try:
                    sched = json.loads(adm.payment_installment_schedule)
                    slots = sched.get("installmentSchedule", [])
                    if slots and slots[0].get("due_date"):
                        due_date = date.fromisoformat(slots[0]["due_date"])
                except Exception:
                    pass

            db.add(FeeInvoice(
                id          = uuid.uuid4(),
                tenant_id   = adm.tenant_id,
                student_id  = student_id,
                invoice_no  = invoice_no,
                amount_due  = fee_amount,
                amount_paid = fee_paid,
                discount    = 0,
                due_date    = due_date,
                status      = status,
            ))
            created += 1
            print(f"  + {invoice_no} ({status})")

        await db.commit()
        print(f"\nDone — created: {created}, skipped: {skipped}")

if __name__ == "__main__":
    asyncio.run(backfill())