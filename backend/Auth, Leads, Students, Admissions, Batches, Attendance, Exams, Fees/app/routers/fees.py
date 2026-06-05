from fastapi import APIRouter, Depends
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.fee import (
    FeeStructureCreate, FeeInvoiceCreate, FeeInvoiceOut,
    PaymentCreate, PaymentOut
)
from app.services import fee as fee_service

router = APIRouter(prefix="/fees", tags=["Fees"])


@router.get("/structures")
async def list_structures(
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
    db: DB = Depends(),
):
    structures = await fee_service.get_fee_structures(db, str(tenant.id))
    return {"success": True, "data": structures}


@router.post("/structures", status_code=201)
async def create_structure(
    body: FeeStructureCreate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
    db: DB = Depends(),
):
    data = body.model_dump()
    if data.get("batch_id"):
        data["batch_id"] = str(data["batch_id"])
    structure = await fee_service.create_fee_structure(db, str(tenant.id), data)
    return {"success": True, "data": structure}


@router.get("/student/{student_id}")
async def student_invoices(
    student_id: str,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "student", "parent")),
    db: DB = Depends(),
):
    invoices = await fee_service.get_student_invoices(db, str(tenant.id), student_id)
    return {"success": True, "data": [FeeInvoiceOut.model_validate(i) for i in invoices]}


@router.post("/invoices", status_code=201)
async def create_invoice(
    body: FeeInvoiceCreate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
    db: DB = Depends(),
):
    data = body.model_dump()
    data["student_id"] = str(data["student_id"])
    if data.get("fee_structure_id"):
        data["fee_structure_id"] = str(data["fee_structure_id"])
    invoice = await fee_service.create_invoice(db, str(tenant.id), data)
    return {"success": True, "data": FeeInvoiceOut.model_validate(invoice)}


@router.post("/invoices/{invoice_id}/pay", status_code=201)
async def record_payment(
    invoice_id: str,
    body: PaymentCreate,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
    db: DB = Depends(),
):
    payment = await fee_service.record_payment(
        db, str(tenant.id), invoice_id, str(current_user.id), body.model_dump()
    )
    return {"success": True, "data": PaymentOut.model_validate(payment)}


@router.get("/invoices/{invoice_id}/payments")
async def get_payments(
    invoice_id: str,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "student", "parent")),
    db: DB = Depends(),
):
    payments = await fee_service.get_payments(db, str(tenant.id), invoice_id)
    return {"success": True, "data": [PaymentOut.model_validate(p) for p in payments]}


@router.get("/revenue/summary")
async def revenue_summary(
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
    db: DB = Depends(),
):
    summary = await fee_service.get_revenue_summary(db, str(tenant.id))
    return {"success": True, "data": summary}
