from pydantic import BaseModel
from typing import Optional
import uuid


class FeeStructureCreate(BaseModel):
    batch_id: Optional[uuid.UUID] = None
    name: str
    total_amount: float
    installments: int = 1
    description: Optional[str] = None


class FeeInvoiceCreate(BaseModel):
    student_id: uuid.UUID
    fee_structure_id: Optional[uuid.UUID] = None
    invoice_no: str
    amount_due: float
    discount: float = 0
    due_date: str


class FeeInvoiceOut(BaseModel):
    id: uuid.UUID
    invoice_no: str
    amount_due: float
    amount_paid: float
    discount: float
    due_date: str
    status: str

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    amount: float
    payment_mode: str = "cash"
    transaction_ref: Optional[str] = None
    notes: Optional[str] = None


class PaymentOut(BaseModel):
    id: uuid.UUID
    amount: float
    payment_mode: str
    transaction_ref: Optional[str] = None

    class Config:
        from_attributes = True
