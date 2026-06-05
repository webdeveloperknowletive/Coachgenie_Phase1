from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, case,update
from app.models.fee import FeeStructure, FeeInvoice, FeePayment
from app.utils.exceptions import NotFoundError, ConflictError, BadRequestError
from app.utils.pagination import paginate
from sqlalchemy.orm import selectinload
from datetime import date



async def get_monthly_collection(db: AsyncSession, tenant_id: str) -> list:
    from sqlalchemy import extract
    result = await db.execute(
        select(
            extract("year",  FeePayment.paid_at).label("year"),
            extract("month", FeePayment.paid_at).label("month"),
            func.coalesce(func.sum(FeePayment.amount), 0).label("collected"),
        )
        .where(FeePayment.tenant_id == tenant_id)
        .group_by("year", "month")
        .order_by("year", "month")
    )
    rows = result.all()
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return [
        {"month": months[int(r.month) - 1], "fees": float(r.collected)}
        for r in rows
    ]

async def get_fee_structures(db: AsyncSession, tenant_id: str) -> list:
    result = await db.execute(
        select(FeeStructure).where(
            and_(FeeStructure.tenant_id == tenant_id, FeeStructure.is_active == True)
        )
    )
    return result.scalars().all()


# async def get_all_invoices(db: AsyncSession, tenant_id: str) -> list:
#     result = await db.execute(
#         select(FeeInvoice)
#         .options(selectinload(FeeInvoice.student))
#         .where(FeeInvoice.tenant_id == tenant_id)
#         .order_by(FeeInvoice.created_at.desc())
#     )
#     return result.scalars().all()
async def get_all_invoices(db: AsyncSession, tenant_id: str) -> list:
    from datetime import date

    # Auto-mark overdue
    await db.execute(
        update(FeeInvoice)
        .where(
            and_(
                FeeInvoice.tenant_id == tenant_id,
                FeeInvoice.status.in_(["pending", "partial"]),
                FeeInvoice.due_date < date.today(),
            )
        )
        .values(status="overdue")
    )

    result = await db.execute(
        select(FeeInvoice)
        .options(selectinload(FeeInvoice.student))
        .where(FeeInvoice.tenant_id == tenant_id)
        .order_by(FeeInvoice.created_at.desc())
    )
    return result.scalars().all()


async def create_fee_structure(db: AsyncSession, tenant_id: str, data: dict) -> FeeStructure:
    fs = FeeStructure(tenant_id=tenant_id, **data)
    db.add(fs)
    await db.flush()
    return fs


async def get_student_invoices(db: AsyncSession, tenant_id: str, student_id: str) -> list:
    result = await db.execute(
        select(FeeInvoice)
        .options(selectinload(FeeInvoice.student))
        .where(
            and_(FeeInvoice.tenant_id == tenant_id, FeeInvoice.student_id == student_id)
        ).order_by(FeeInvoice.due_date.asc())
    )
    return result.scalars().all()


async def create_invoice(db: AsyncSession, tenant_id: str, data: dict) -> FeeInvoice:
    existing = await db.execute(
        select(FeeInvoice).where(
            and_(
                FeeInvoice.tenant_id  == tenant_id,
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
        tenant_id   = tenant_id,
        invoice_id  = invoice_id,
        student_id  = invoice.student_id,
        received_by = received_by,
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
    today = date.today()

    result = await db.execute(
        select(
            # Total collected = sum of amount_paid across ALL invoices
            func.coalesce(func.sum(FeeInvoice.amount_paid), 0).label("total_collected"),

            # Total invoices count
            func.count(FeeInvoice.id).label("total_invoices"),

            # Outstanding = sum of (amount_due - amount_paid - discount)
            # only for invoices that are NOT fully paid
            func.coalesce(
                func.sum(
                    case(
                        (
                            FeeInvoice.status.in_(["pending", "partial", "overdue"]),
                            FeeInvoice.amount_due
                            - FeeInvoice.amount_paid
                            - FeeInvoice.discount,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("total_outstanding"),

            # Overdue count = unpaid invoices where due_date < today
            func.count(
                case(
                    (
                        and_(
                            FeeInvoice.status.in_(["pending", "partial", "overdue"]),
                            FeeInvoice.due_date < today,
                        ),
                        FeeInvoice.id,
                    ),
                    else_=None,
                )
            ).label("overdue_count"),

            # Pending count = status is pending
            func.count(
                case(
                    (FeeInvoice.status == "pending", FeeInvoice.id),
                    else_=None,
                )
            ).label("pending_count"),
        ).where(FeeInvoice.tenant_id == tenant_id)
    )

    row = result.one()

    return {
        "total_collected":   float(row.total_collected),
        "total_outstanding": float(row.total_outstanding),
        "total_invoices":    int(row.total_invoices),
        "overdue_count":     int(row.overdue_count),
        "pending_count":     int(row.pending_count),
    }