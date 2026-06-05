import { NextResponse } from "next/server";

const API_BASE = `${process.env.API_URL ?? "http://localhost:8000"}/api/v1`;

/**
 * Build the headers FastAPI needs from the incoming Next.js request.
 *
 * FastAPI dependencies require:
 *   - Authorization: Bearer <token>   → get_current_user / require_roles
 *   - X-Tenant-Subdomain              → get_tenant (primary)
 *   - X-Tenant-Id                     → get_tenant (UUID fallback)
 */
function forwardHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const auth      = req.headers.get("authorization");
  const subdomain = req.headers.get("x-tenant-subdomain");
  const tenantId  = req.headers.get("x-tenant-id");

  if (auth)      headers["authorization"]      = auth;
  if (subdomain) headers["x-tenant-subdomain"] = subdomain;
  if (tenantId)  headers["x-tenant-id"]        = tenantId;

  return headers;
}

/**
 * Normalize a single admission record from FastAPI (snake_case) to the
 * camelCase shape the frontend Admission type expects.
 *
 * FastAPI returns:         Frontend expects:
 *   student_name      →     studentName
 *   fee_amount        →     feeAmount
 *   fee_paid          →     feePaid
 *   created_at        →     createdAt
 *   applied_course    →     subjects  (wrapped in array)
 *   payment           →     payment   (nested object, passed through as-is)
 */
function normalizeAdmission(a: Record<string, any>) {
  return {
    // identity
    id:                 a.id,
    admission_number:   a.admission_number,

    // camelCase aliases the frontend Admission type uses
    studentName:        a.student_name        ?? a.studentName        ?? "",
    feeAmount:          a.fee_amount          ?? a.feeAmount          ?? 0,
    feePaid:            a.fee_paid            ?? a.feePaid            ?? 0,
    createdAt:          a.created_at          ?? a.createdAt          ?? new Date().toISOString(),

    batch_id:    a.batch_id   ?? null,   // ← ADD
    batch_name:  a.batch_name ?? "",     // ← ADD
    board_name:  a.board_name ?? "",     // ← ADD
    
    // subjects: backend stores batchName in applied_course
    subjects:           a.subjects?.length
                          ? a.subjects
                          : a.applied_course
                          ? [a.applied_course]
                          : [],

    // status & flags
    status:             a.status              ?? "PENDING_DOCS",
    documents_verified: a.documents_verified  ?? false,
    documents:          a.documents           ?? [],
    grade:              a.grade               ?? "",
    remarks:            a.remarks             ?? null,
    lead_id:            a.lead_id             ?? null,
    approved_at:        a.approved_at         ?? null,

    // keep snake_case copies too so detail pages that read snake_case still work
    student_name:       a.student_name        ?? a.studentName        ?? "",
    fee_amount:         a.fee_amount          ?? a.feeAmount          ?? 0,
    fee_paid:           a.fee_paid            ?? a.feePaid            ?? 0,
    created_at:         a.created_at          ?? a.createdAt          ?? null,
    applied_course:     a.applied_course      ?? "",

    // payment blob — passed through as-is (already normalized by backend)
    payment:            a.payment             ?? null,
  };
}

// GET — list admissions
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const params = new URLSearchParams();
  for (const [key, val] of searchParams.entries()) {
    params.set(key, val);
  }

  const upstream = await fetch(
    `${API_BASE}/admissions/?${params.toString()}`,
    { headers: forwardHeaders(req), cache: "no-store" },
  );

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  // FastAPI returns { success: true, data: [...], total, page, limit }
  const normalized = {
    ...data,
    data: Array.isArray(data.data)
      ? data.data.map(normalizeAdmission)
      : [],
  };

  return NextResponse.json(normalized, { status: 200 });
}

// POST — create admission
export async function POST(req: Request) {
  const body = await req.json();

  const payload = {
    student_name:       body.student_name  ?? body.studentName  ?? null,
    batchName:          body.batchName     ?? null,
    batch_name:         body.batch_name    ?? body.batchName    ?? null,  // ← ADD
    batch_id:           body.batch_id      ?? null,                       // ← ADD
    board_name:         body.board_name    ?? null,                       // ← ADD
    grade:              body.grade         ?? "",
    subjects:           body.subjects      ?? [],
    status:             body.status        ?? "PENDING_DOCS",
    fee_amount:         body.fee_amount    ?? body.feeAmount    ?? 0,
    fee_paid:           body.fee_paid      ?? body.feePaid      ?? 0,
    lead_id:            body.lead_id       ?? body.leadId       ?? null,
    documents:          body.documents     ?? [],
    documents_verified: body.documents_verified ?? false,
    remarks:            body.remarks       ?? null,
    payment:            body.payment       ?? null,
     phone:              body.phone         ?? null,
    email:              body.email         ?? null,
    parent_name:        body.parent_name   ?? null,
    parent_phone:       body.parent_phone  ?? null,
    school_name:        body.school_name   ?? null,
  };

  const upstream = await fetch(`${API_BASE}/admissions/`, {
    method:  "POST",
    headers: forwardHeaders(req),
    body:    JSON.stringify(payload),
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  // FastAPI returns { success: true, data: { ...admission } }
  // Normalize the created record so the frontend store gets camelCase immediately
  const normalized = {
    ...data,
    data: data.data ? normalizeAdmission(data.data) : null,
  };

  return NextResponse.json(normalized, { status: 201 });
}