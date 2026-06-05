import asyncio
import uuid
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.fee import FeeInvoice, FeePayment

async def backfill():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(FeeInvoice).where(FeeInvoice.amount_paid > 0)
        )
        invoices = result.scalars().all()
        created, skipped = 0, 0

        for inv in invoices:
            existing = await db.execute(
                select(FeePayment).where(FeePayment.invoice_id == inv.id)
            )
            if existing.scalar_one_or_none():
                skipped += 1
                continue

            db.add(FeePayment(
                id              = uuid.uuid4(),
                tenant_id       = inv.tenant_id,
                invoice_id      = inv.id,
                student_id      = inv.student_id,
                amount          = inv.amount_paid,
                payment_mode    = "cash",
                transaction_ref = None,
                notes           = "Backfilled from admission record",
                received_by     = None,
            ))
            created += 1
            print(f"  + {inv.invoice_no} — ₹{inv.amount_paid}")

        await db.commit()
        print(f"\nDone — created: {created}, skipped: {skipped}")

if __name__ == "__main__":
    asyncio.run(backfill())