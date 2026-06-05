from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.fee import FeeStructure, FeeInvoice, FeePayment
from app.utils.exceptions import NotFoundError, ConflictError, BadRequestError
from app.utils.pagination import paginate


async def get_fee_structures(db: AsyncSession, tenant_id: str) -> list:
    result = await db.execute(
        select(FeeStructure).where(
            and_(FeeStructure.tenant_id == tenant_id, FeeStructure.is_active == True)
        )
    )
    return result.scalars().all()


async def create_fee_structure(db: AsyncSession, tenant_id: str, data: dict) -> FeeStructure:
    fs = FeeStructure(tenant_id=tenant_id, **data)
    db.add(fs)
    await db.flush()
    return fs


async def get_student_invoices(db: AsyncSession, tenant_id: str, student_id: str) -> list:
    result = await db.execute(
        select(FeeInvoice).where(
            and_(FeeInvoice.tenant_id == tenant_id, FeeInvoice.student_id == student_id)
        ).order_by(FeeInvoice.due_date.asc())
    )
    return result.scalars().all()


async def create_invoice(db: AsyncSession, tenant_id: str, data: dict) -> FeeInvoice:
    existing = await db.execute(
        select(FeeInvoice).where(
            and_(
                FeeInvoice.tenant_id == tenant_id,
                FeeInvoice.invoice_no == data["invoice_no"]
            )
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("Invoice number already exists.")

    invoice = FeeInvoice(tenant_id=tenant_id, **data)
    db.add(invoice)
    await db.flush()
    return invoice


async def record_payment(db: AsyncSession, tenant_id: str, invoice_id: str,
                         received_by: str, data: dict) -> FeePayment:
    result = await db.execute(
        select(FeeInvoice).where(
            and_(FeeInvoice.id == invoice_id, FeeInvoice.tenant_id == tenant_id)
        )
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise NotFoundError("Invoice")
    if invoice.status == "paid":
        raise BadRequestError("Invoice is already fully paid.")

    payment = FeePayment(
        tenant_id=tenant_id,
        invoice_id=invoice_id,
        student_id=invoice.student_id,
        received_by=received_by,
        **data,
    )
    db.add(payment)

    new_paid = float(invoice.amount_paid) + float(data["amount"])
    invoice.amount_paid = new_paid
    invoice.status = "paid" if new_paid >= float(invoice.amount_due) else "partial"

    await db.flush()
    return payment


async def get_payments(db: AsyncSession, tenant_id: str, invoice_id: str) -> list:
    result = await db.execute(
        select(FeePayment).where(
            and_(FeePayment.invoice_id == invoice_id, FeePayment.tenant_id == tenant_id)
        ).order_by(FeePayment.paid_at.desc())
    )
    return result.scalars().all()


async def get_revenue_summary(db: AsyncSession, tenant_id: str) -> dict:
    result = await db.execute(
        select(
            func.sum(FeeInvoice.amount_due).label("total_due"),
            func.sum(FeeInvoice.amount_paid).label("total_collected"),
            func.count(FeeInvoice.id).label("total_invoices"),
        ).where(FeeInvoice.tenant_id == tenant_id)
    )
    row = result.one()
    return {
        "total_due": float(row.total_due or 0),
        "total_collected": float(row.total_collected or 0),
        "total_pending": float((row.total_due or 0) - (row.total_collected or 0)),
        "total_invoices": row.total_invoices,
    }
