from fastapi import APIRouter, Depends
from app.dependencies import get_tenant, require_roles, DB
from app.schemas.fee import FeeStructureCreate, FeeInvoiceCreate, FeeInvoiceOut, PaymentCreate, PaymentOut
from app.services import fee as fee_service
from sqlalchemy import select
from fastapi import HTTPException
from app.models.student import Student

router = APIRouter(prefix="/fees", tags=["Fees"])

@router.get("/monthly-trend")
async def monthly_trend(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
):
    data = await fee_service.get_monthly_collection(db, str(tenant.id))
    return {"success": True, "data": data}

@router.get("/structures")
async def list_structures(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    structures = await fee_service.get_fee_structures(db, str(tenant.id))
    return {"success": True, "data": structures}

@router.get("/invoices")
async def list_all_invoices(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    invoices = await fee_service.get_all_invoices(db, str(tenant.id))
    return {"success": True, "data": [FeeInvoiceOut.model_validate(i) for i in invoices]}

@router.post("/structures", status_code=201)
async def create_structure(
    body: FeeStructureCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
):
    data = body.model_dump()
    if data.get("batch_id"): data["batch_id"] = str(data["batch_id"])
    structure = await fee_service.create_fee_structure(db, str(tenant.id), data)
    return {"success": True, "data": structure}

@router.get("/student/{student_id}")
async def student_invoices(
    student_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(
        require_roles("owner", "counselor", "student", "parent")
    ),
):

    # STAFF ROLES CAN ACCESS ANY STUDENT
    if current_user.role in ["owner", "counselor"]:
        invoices = await fee_service.get_student_invoices(
            db,
            str(tenant.id),
            student_id
        )

        return {
            "success": True,
            "data": [FeeInvoiceOut.model_validate(i) for i in invoices]
        }

    # STUDENT/PARENT CAN ONLY ACCESS THEIR OWN DATA
    student_query = await db.execute(
        select(Student).where(
            Student.user_id == current_user.id,
            Student.tenant_id == tenant.id
        )
    )

    student = student_query.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=403,
            detail="Student record not found"
        )

    # BLOCK ACCESS TO OTHER STUDENTS
    if str(student.id) != student_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    invoices = await fee_service.get_student_invoices(
        db,
        str(tenant.id),
        student_id
    )

    return {
        "success": True,
        "data": [FeeInvoiceOut.model_validate(i) for i in invoices]
    }

@router.post("/invoices", status_code=201)
async def create_invoice(
    body: FeeInvoiceCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    data = body.model_dump()
    data["student_id"] = str(data["student_id"])
    if data.get("fee_structure_id"): data["fee_structure_id"] = str(data["fee_structure_id"])
    invoice = await fee_service.create_invoice(db, str(tenant.id), data)
    return {"success": True, "data": FeeInvoiceOut.model_validate(invoice)}

@router.post("/invoices/{invoice_id}/pay", status_code=201)
async def record_payment(
    invoice_id: str,
    body: PaymentCreate,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor")),
):
    payment = await fee_service.record_payment(db, str(tenant.id), invoice_id, str(current_user.id), body.model_dump())
    return {"success": True, "data": PaymentOut.model_validate(payment)}

@router.get("/invoices/{invoice_id}/payments")
async def get_payments(
    invoice_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "counselor", "student", "parent")),
):
    payments = await fee_service.get_payments(db, str(tenant.id), invoice_id)
    return {"success": True, "data": [PaymentOut.model_validate(p) for p in payments]}

@router.get("/revenue/summary")
async def revenue_summary(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
):
    summary = await fee_service.get_revenue_summary(db, str(tenant.id))
    return {"success": True, "data": summary}
