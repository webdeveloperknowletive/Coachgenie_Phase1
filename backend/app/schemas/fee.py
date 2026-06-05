# from pydantic import BaseModel
# from typing import Optional
# import uuid


# class FeeStructureCreate(BaseModel):
#     batch_id: Optional[uuid.UUID] = None
#     name: str
#     total_amount: float
#     installments: int = 1
#     description: Optional[str] = None


# class FeeInvoiceCreate(BaseModel):
#     student_id: uuid.UUID
#     fee_structure_id: Optional[uuid.UUID] = None
#     invoice_no: str
#     amount_due: float
#     discount: float = 0
#     due_date: str


# class FeeInvoiceOut(BaseModel):
#     id: uuid.UUID
#     invoice_no: str
#     amount_due: float
#     amount_paid: float
#     discount: float
#     due_date: str
#     status: str

#     class Config:
#         from_attributes = True


# class PaymentCreate(BaseModel):
#     amount: float
#     payment_mode: str = "cash"
#     transaction_ref: Optional[str] = None
#     notes: Optional[str] = None


# class PaymentOut(BaseModel):
#     id: uuid.UUID
#     amount: float
#     payment_mode: str
#     transaction_ref: Optional[str] = None

#     class Config:
#         from_attributes = True

import uuid
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime


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
    id:           uuid.UUID
    invoice_no:   str
    student_id:   uuid.UUID
    amount_due:   float
    amount_paid:  float
    discount:     float
    due_date:     date
    status:       str
    created_at:   Optional[datetime] = None

    # Flattened from student relationship
    student_name:  Optional[str] = None
    grade:         Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        instance = super().model_validate(obj, *args, **kwargs)
        # Flatten student name from relationship if present
        if hasattr(obj, "student") and obj.student:
            s = obj.student
            first = getattr(s, "first_name", "") or ""
            last  = getattr(s, "last_name",  "") or ""
            instance.student_name = f"{first} {last}".strip() or None
            instance.grade        = getattr(s, "current_class", None)
        return instance


class PaymentCreate(BaseModel):
    amount: float
    payment_mode: str = "cash"
    transaction_ref: Optional[str] = None
    notes: Optional[str] = None


class PaymentOut(BaseModel):
    id:               uuid.UUID
    amount:           float
    payment_mode:     str
    transaction_ref:  Optional[str] = None
    model_config = {"from_attributes": True}
    paid_at:          Optional[datetime] = None   # ✅ add
    created_at:       Optional[datetime] = None