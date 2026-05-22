import json
import uuid
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.admission import Admission
from app.models.student import Student
from app.models.lead import Lead
from app.utils.exceptions import NotFoundError
from app.utils.pagination import paginate

# ── Admission number generator ─────────────────────────────────────────────────
async def next_admission_no(db: AsyncSession, tenant_id: str) -> str:
    year   = datetime.now().year
    prefix = f"ADM-{year}-"
    result = await db.execute(
        select(func.max(Admission.admission_number)).where(
            Admission.tenant_id == tenant_id,
            Admission.admission_number.like(f"{prefix}%"),
        )
    )
    last: str | None = result.scalar()
    if last:
        try:
            last_seq = int(last.replace(prefix, ""))
        except ValueError:
            last_seq = 0
    else:
        last_seq = 0
    return f"{prefix}{str(last_seq + 1).zfill(4)}"


# ── Enrollment number generator ────────────────────────────────────────────────
async def next_enrollment_no(db: AsyncSession, tenant_id: str) -> str:
    year   = datetime.now().year
    prefix = f"STU-{year}-"
    result = await db.execute(
        select(func.max(Student.enrollment_no)).where(
            Student.tenant_id == tenant_id,
            Student.enrollment_no.like(f"{prefix}%"),
        )
    )
    last: str | None = result.scalar()
    if last:
        try:
            last_seq = int(last.replace(prefix, ""))
        except ValueError:
            last_seq = 0
    else:
        last_seq = 0
    return f"{prefix}{str(last_seq + 1).zfill(4)}"


# ── CRUD ───────────────────────────────────────────────────────────────────────
async def get_admissions(
    db: AsyncSession,
    tenant_id: str,
    page: int,
    limit: int,
    status: str | None,
) -> dict:
    conditions = [Admission.tenant_id == tenant_id]
    if status:
        conditions.append(Admission.status == status)

    from sqlalchemy import and_
    total = await db.scalar(
        select(func.count()).select_from(Admission).where(and_(*conditions))
    )
    rows = await db.execute(
        select(Admission).where(and_(*conditions))
        .order_by(Admission.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return paginate(rows.scalars().all(), total, page, limit)


async def get_admission(
    db: AsyncSession, tenant_id: str, admission_id: str
) -> Admission:
    from sqlalchemy import and_
    result = await db.execute(
        select(Admission).where(
            and_(
                Admission.id == admission_id,
                Admission.tenant_id == tenant_id,
            )
        )
    )
    admission = result.scalar_one_or_none()
    if not admission:
        raise NotFoundError("Admission")
    return admission


async def create_admission(
    db: AsyncSession, tenant_id: str, data: dict
) -> Admission:
    print("FULL INCOMING DATA:", data)
    print("DEBUG create_admission subjects:", data.get("subjects"))  # ← add this
    # admission_number = await next_admission_no(db, tenant_id)
    # admission_number = await next_admission_no(db, tenant_id)

    # admission = Admission(
    #     id               = uuid.uuid4(),
    #     tenant_id        = tenant_id,
    #     admission_number = admission_number,
    #     academic_year    = data.get("academic_year") or str(datetime.now().year),
    #     applied_course   = data.get("applied_course") or data.get("batchName") or "N/A",
    #     status           = data.get("status", "PENDING_DOCS"),
    #     documents_verified = data.get("documents_verified", False),
    #     remarks          = data.get("remarks") or data.get("notes"),
    #     lead_id          = data.get("lead_id"),
    #     student_name     = data.get("student_name") or data.get("studentName"),
    #     phone            = data.get("phone"),
    #     email            = data.get("email"),
    #     parent_name      = data.get("parent_name"),
    #     parent_phone     = data.get("parent_phone"),
    #     school_name      = data.get("school_name"),
    #     grade            = data.get("grade"),
    #     board_name       = data.get("board_name"),
    #     documents = data.get("documents") or [],
    #     subjects  = data.get("subjects")  or [],
    # )
    # db.add(admission)
    # await db.flush()
    # return admission
    admission_number = await next_admission_no(db, tenant_id)

    # Serialize payment object → JSON text for storage
    payment_data = data.get("payment")
    payment_json: str | None = None

    # Serialize payment → JSON (always, regardless of batch)
    if payment_data:
        payment_json = json.dumps(
            payment_data if isinstance(payment_data, dict)
            else payment_data.model_dump()
        )

    # Parse batch_id UUID
    batch_id_raw = data.get("batch_id")
    batch_id_val = None
    if batch_id_raw:
        try:
            batch_id_val = uuid.UUID(str(batch_id_raw))
        except Exception:
            print("INVALID batch_id:", batch_id_raw)


    admission = Admission(
        id               = uuid.uuid4(),
        tenant_id        = tenant_id,
        admission_number = admission_number,
        academic_year    = data.get("academic_year") or str(datetime.now().year),
        applied_course   = data.get("applied_course") or data.get("batchName") or "N/A",
        status           = data.get("status", "PENDING_DOCS"),
        documents_verified = data.get("documents_verified", False),
        remarks          = data.get("remarks") or data.get("notes"),
        lead_id          = data.get("lead_id"),
        student_name     = data.get("student_name") or data.get("studentName"),
        phone            = data.get("phone"),
        email            = data.get("email"),
        parent_name      = data.get("parent_name"),
        parent_phone     = data.get("parent_phone"),
        school_name      = data.get("school_name"),
        grade            = data.get("grade"),
        board_name       = data.get("board_name"),
        batch_name = data.get("batch_name") or data.get("batchName"),
        batch_id   = batch_id_val,
        fee_amount                   = data.get("fee_amount") or 0,
        fee_paid                     = data.get("fee_paid") or 0,
        payment_installment_schedule = payment_json,
        documents = data.get("documents") or [],
        subjects  = [s for s in (data.get("subjects") or []) if s and s != "N/A"],
    )
    db.add(admission)
    await db.flush()

    # Always create the linked student record immediately on admission creation
    await generate_student_from_admission(db, admission)

    return admission


async def update_admission(
    db: AsyncSession,
    tenant_id: str,
    admission_id: str,
    data: dict,
    updated_by: str | None = None,
) -> Admission:
    admission = await get_admission(db, tenant_id, admission_id)

    was_confirmed = admission.status == "CONFIRMED"

    for key, value in data.items():
        if hasattr(admission, key) and value is not None:
            setattr(admission, key, value)
    if updated_by:
        admission.updated_by = updated_by

    await db.flush()

    # ── Bug 1 fix: generate student when status transitions to CONFIRMED ──
    if not was_confirmed and admission.status == "CONFIRMED":
        await generate_student_from_admission(db, admission)

    return admission

# ── Approve ────────────────────────────────────────────────────────────────────
async def approve_admission(
    db: AsyncSession,
    tenant_id: str,
    admission_id: str,
    approved_by: str,
) -> Admission:
    admission = await get_admission(db, tenant_id, admission_id)
    if admission.status == "CONFIRMED":
        return admission  # idempotent
    admission.status      = "CONFIRMED"
    admission.approved_by = approved_by
    admission.approved_at = datetime.now()
    await db.flush()
    return admission


# ── Reject ─────────────────────────────────────────────────────────────────────
async def reject_admission(
    db: AsyncSession,
    tenant_id: str,
    admission_id: str,
    updated_by: str,
    reason: str | None = None,
) -> Admission:
    admission = await get_admission(db, tenant_id, admission_id)
    admission.status     = "REJECTED"
    admission.updated_by = updated_by
    if reason:
        admission.remarks = reason
    await db.flush()
    return admission


# ── Core: generate student from admission ──────────────────────────────────────
# This is the SINGLE function both paths call.
# lead_id=None  → walk-in path (direct admission)
# lead_id set   → lead-conversion path
# Both produce identical Student records.
async def generate_student_from_admission(
    db: AsyncSession,
    admission: Admission,
) -> Student:
    # Guard: already generated
    from sqlalchemy import and_
    existing = await db.scalar(
        select(Student).where(
            and_(
                Student.tenant_id   == admission.tenant_id,
                Student.admission_id == admission.id,
            )
        )
    )
    if existing:
        return existing

    # Fetch linked lead for contact data (lead-path only)
    lead: Lead | None = None
    if admission.lead_id:
        lead = await db.get(Lead, admission.lead_id)

    # Split full name into first / last
    full_name  = (admission.student_name or "").strip()
    parts      = full_name.split(" ", 1)
    first_name = parts[0] or "Unknown"
    last_name  = parts[1] if len(parts) > 1 else ""

    enrollment_no = await next_enrollment_no(db, str(admission.tenant_id))

    # student = Student(
    #     id            = uuid.uuid4(),
    #     tenant_id     = admission.tenant_id,
    #     admission_id  = admission.id,
    #     enrollment_no = enrollment_no,
    #     first_name    = first_name,
    #     last_name     = last_name,
    #     current_class = admission.grade or "",
    #     is_active     = True,
    #     joined_at     = datetime.now().date(),
    #     # Lead contact data takes priority; admission fields are fallback for walk-ins
    #     email         = (lead.email                  if lead else None) or admission.email,
    #     phone         = (lead.phone                  if lead else None) or admission.phone,
    #     parent_name   = (lead.parent_name            if lead else None) or admission.parent_name,
    #     parent_phone  = (lead.parent_contact_number  if lead else None) or admission.parent_phone,
    #     school_name   = (lead.school_name            if lead else None) or admission.school_name,
    #     target_exam   = lead.interested_course if lead else None,
    #     subjects = [s for s in (admission.subjects or []) if s and s != "N/A"],
    # )
    # db.add(student)
    # await db.flush()
    # return student
    student = Student(
        id            = uuid.uuid4(),
        tenant_id     = admission.tenant_id,
        admission_id  = admission.id,
        enrollment_no = enrollment_no,
        first_name    = first_name,
        last_name     = last_name,
        current_class = admission.grade or "",
        is_active     = True,
        joined_at     = datetime.now().date(),
        email         = (lead.email                  if lead else None) or admission.email,
        phone         = (lead.phone                  if lead else None) or admission.phone,
        parent_name   = (lead.parent_name            if lead else None) or admission.parent_name,
        parent_phone  = (lead.parent_contact_number  if lead else None) or admission.parent_phone,
        school_name   = (lead.school_name            if lead else None) or admission.school_name,
        target_exam   = lead.interested_course if lead else None,
        subjects      = [s for s in (admission.subjects or []) if s and s != "N/A"],
    )
    db.add(student)
    await db.flush()

    # Auto-enroll student into the batch if batch_name is set
    # if admission.batch_name:
    #     from app.models.batch import Batch, BatchStudent
    #     batch_result = await db.execute(
    #         select(Batch).where(
    #             and_(
    #                 Batch.tenant_id == admission.tenant_id,
    #                 Batch.name      == admission.batch_name,
    #             )
    #         )
    #     )
    #     batch = batch_result.scalar_one_or_none()
    #     if batch:
    #         # Check not already enrolled
    #         existing = await db.scalar(
    #             select(BatchStudent).where(
    #                 and_(
    #                     BatchStudent.batch_id   == batch.id,
    #                     BatchStudent.student_id == student.id,
    #                 )
    #             )
    #         )
    #         if not existing:
    #             db.add(BatchStudent(
    #                 batch_id    = batch.id,
    #                 student_id  = student.id,
    #                 enrolled_at = datetime.now().date(),
    #             ))
    #             await db.flush()

    # return student
    if admission.batch_id:
        from app.models.batch import Batch, BatchStudent
        batch = await db.get(Batch, admission.batch_id)
        if batch:
            existing = await db.scalar(
                select(BatchStudent).where(
                    and_(
                        BatchStudent.batch_id   == batch.id,
                        BatchStudent.student_id == student.id,
                    )
                )
            )
            if not existing:
                db.add(BatchStudent(
                    batch_id    = batch.id,
                    student_id  = student.id,
                    enrolled_at = datetime.now().date(),
                ))
                await db.flush()

    return student


# ── Lead conversion: atomic, single entry point ────────────────────────────────
async def convert_lead(
    db: AsyncSession,
    tenant_id: str,
    lead_id: str,
    converted_by: str,
    admission_data: dict | None = None,
) -> tuple[Admission, Student]:
    """
    Converts a lead → admission → student in a single atomic flush.
    Marks the lead as converted.
    Returns (admission, student).
    """
    from sqlalchemy import and_
    from app.utils.exceptions import ConflictError

    # 1. Fetch lead
    lead_result = await db.execute(
        select(Lead).where(
            and_(Lead.id == lead_id, Lead.tenant_id == tenant_id)
        )
    )
    lead = lead_result.scalar_one_or_none()
    if not lead:
        raise NotFoundError("Lead")
    if lead.status == "converted":
        raise ConflictError("Lead is already converted.")

    # 2. Check no admission exists for this lead yet
    existing_adm = await db.scalar(
        select(Admission).where(
            and_(
                Admission.tenant_id == tenant_id,
                Admission.lead_id   == lead_id,
            )
        )
    )
    if existing_adm:
        raise ConflictError("An admission already exists for this lead.")

    # 3. Create admission from lead data
    data = {
        "lead_id":       str(lead.id),
        "student_name":  lead.full_name,
        "phone":         lead.phone,
        "email":         lead.email,
        "parent_name":   lead.parent_name,
        "parent_phone":  lead.parent_contact_number or lead.parent_phone,
        "school_name":   lead.school_name,
        "grade":         lead.grade,
        "board_name":    lead.board_name,
        "applied_course": lead.interested_course or "N/A",
        "status":        "CONFIRMED",
        "documents_verified": False,                  # ← was wrongly set to lead.documents
        "documents":          lead.documents or [],   # ← documents in correct field
        "subjects":           lead.subjects or [],
        **(admission_data or {}),
    }
    admission = await create_admission(db, tenant_id, data)

    # 4. Auto-approve and generate student
    admission.status      = "CONFIRMED"
    admission.approved_by = converted_by
    admission.approved_at = datetime.now()
    await db.flush()

    student = await generate_student_from_admission(db, admission)

    # 5. Mark lead as converted
    lead.status       = "converted"
    lead.converted_at = datetime.now()
    await db.flush()

    return admission, student