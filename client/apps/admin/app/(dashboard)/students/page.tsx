"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAcademicStore } from "@/lib/stores/academic.store";
import { StudentTable }     from "@/components/students/StudentTable";
import { StudentForm, type StudentFormValues } from "@/components/students/StudentForm";
import type { Student } from "@/lib/types/academic";

// ── API helpers ────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function authHeaders(): HeadersInit {
  let token: string | null = null;
  let tenantId: string | null = null;
  try {
    const authRaw  = localStorage.getItem("coachgenie-auth");
    const authData = authRaw ? JSON.parse(authRaw)?.state : null;
    token    = authData?.accessToken ?? null;
    tenantId = authData?.tenantId    ?? null;
  } catch {
    token = sessionStorage.getItem("access_token");
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token)    headers["Authorization"] = `Bearer ${token}`;
  if (tenantId) headers["X-Tenant-Id"]   = tenantId;
  return headers;
}

/** Compute fee summary from invoices array */
function computeFees(invoices: any[]) {
  const total = invoices.reduce((s, i) => s + parseFloat(i.amount_due  ?? 0), 0);
  const paid  = invoices.reduce((s, i) => s + parseFloat(i.amount_paid ?? 0), 0);
  return { total, paid, due: total - paid };
}

/** Map raw API StudentOut → frontend Student shape */
function mapStudent(raw: any, fees?: { total: number; paid: number; due: number }): Student {
  return {
    id:          String(raw.id),
    name:        `${raw.first_name ?? ""} ${raw.last_name ?? ""}`.trim(),
    email:       raw.email         ?? "",
    phone:       raw.phone         ?? "",
    parentName:  raw.parent_name   ?? "",
    parentPhone: raw.parent_phone  ?? "",
    grade: (raw.current_class ?? "").replace(/th|st|nd|rd$/i, ""),
    subjects: raw.subjects ?? [],
    batchIds:    raw.batch_ids     ?? [],
    status:      raw.is_active === false ? "INACTIVE" : "ACTIVE",
    address:     raw.address       ?? "",
    dob:         raw.date_of_birth ?? "",
    joinedAt:    raw.joined_at     ?? raw.created_at ?? new Date().toISOString(),
    admissionId: raw.admission_id  ?? null,
    fees: fees ?? { total: 0, paid: 0, due: 0 },
    targetExam: raw.target_exam ?? "",
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const { students, setStudents, addStudent, updateStudent } = useAcademicStore();

  const [showForm,    setShowForm]    = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  // ── Fetch students + their fee summaries ──────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API}/students/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      const raw: any[] = Array.isArray(json) ? json : (json.data ?? json.items ?? []);
      // const admissionStudents = raw.filter((s) => s.admission_id != null);
      const admissionStudents = raw;

      const enriched = await Promise.all(
  admissionStudents.map(async (s) => {
    let fees = { total: 0, paid: 0, due: 0 };
    try {
      const fRes = await fetch(`${API}/fees/student/${s.id}`, { headers: authHeaders() });
      const fJson = fRes.ok ? await fRes.json() : {};
      const invoices: any[] = Array.isArray(fJson)
        ? fJson
        : (fJson.data ?? fJson.items ?? []);

      if (invoices.length > 0) {
        fees = computeFees(invoices);
      } else if (s.admission_id) {
        // No invoice yet — fallback to fee fields on the linked admission
        const aRes = await fetch(`${API}/admissions/${s.admission_id}`, { headers: authHeaders() });
        if (aRes.ok) {
          const aJson = await aRes.json();
          const adm   = aJson.data ?? aJson;
          const total = parseFloat(adm.fee_amount ?? 0);
          const paid  = parseFloat(adm.fee_paid  ?? 0);
          fees = { total, paid, due: total - paid };
        }
      }
    } catch {}

    return { ...s, _fees: fees };
  })
);

      setStudents(enriched.map((s) => mapStudent(s, s._fees)));
    } catch (err: any) {
      const msg = err.message ?? "Failed to load students";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [setStudents]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Create ─────────────────────────────────────────────────────────────────
  async function handleCreate(data: StudentFormValues) {
    try {
      const nameParts  = (data.name ?? "").trim().split(" ");
      const first_name = nameParts[0] ?? "";
      const last_name  = nameParts.slice(1).join(" ") || "";

      const res = await fetch(`${API}/students/`, {
        method:  "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          enrollment_no: `STU-${Date.now()}`,
          first_name,
          last_name,
          email:         data.email       || undefined,
          phone:         data.phone       || undefined,
          parent_name:   data.parentName  || undefined,
          parent_phone:  data.parentPhone || undefined,
          current_class: data.grade       || undefined,
          address:       data.address     || undefined,
          date_of_birth: data.dob         || undefined,
          target_exam:   data.targetExam  || undefined,
          school_name:   data.schoolName  || undefined,
          gender:        data.gender      || undefined,
          subjects:      [],
        }),
      });

      if (!res.ok) {
        const err    = await res.json().catch(() => ({}));
        const detail = Array.isArray(err.detail)
          ? err.detail.map((e: any) => `${e.loc?.slice(-1)[0]}: ${e.msg}`).join(", ")
          : (err.detail ?? "Failed to create student");
        throw new Error(detail);
      }

      const json    = await res.json();
      const created = json.data ?? json;
      addStudent(mapStudent(created));
      toast.success("Student created!");
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  async function handleUpdate(data: StudentFormValues) {
    if (!editStudent) return;
    try {
      const nameParts  = (data.name ?? "").trim().split(" ");
      const first_name = nameParts[0] ?? "";
      const last_name  = nameParts.slice(1).join(" ") || "";

      const res = await fetch(`${API}/students/${editStudent.id}`, {
        method:  "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          first_name,
          last_name,
          email:         data.email       || undefined,
          phone:         data.phone       || undefined,
          parent_name:   data.parentName  || undefined,
          parent_phone:  data.parentPhone || undefined,
          current_class: data.grade       || undefined,
          address:       data.address     || undefined,
          date_of_birth: data.dob         || undefined,
          target_exam:   data.targetExam  || undefined,
          school_name:   data.schoolName  || undefined,
          gender:        data.gender      || undefined,
          subjects:      [],
        }),
      });

      if (!res.ok) {
        const err    = await res.json().catch(() => ({}));
        const detail = Array.isArray(err.detail)
          ? err.detail.map((e: any) => `${e.loc?.slice(-1)[0]}: ${e.msg}`).join(", ")
          : (err.detail ?? "Failed to update student");
        throw new Error(detail);
      }

      const json    = await res.json();
      const updated = json.data ?? json;
      updateStudent(editStudent.id, mapStudent(updated, editStudent.fees));
      toast.success("Student updated!");
      setEditStudent(null);
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    }
  }

  // ── Deactivate ─────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${API}/students/${id}`, {
        method:  "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to deactivate student");
      updateStudent(id, { status: "INACTIVE" });
      toast.success("Student deactivated");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to deactivate student");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const activeCount = students.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${students.length} total · ${activeCount} active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchStudents} disabled={loading}
            className="rounded-lg border p-2 hover:bg-accent transition-colors disabled:opacity-50" title="Refresh">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && fetchError && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-16 text-center">
          <p className="text-sm text-destructive">{fetchError}</p>
          <button onClick={fetchStudents}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && students.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">No students yet</p>
          <p className="text-xs text-muted-foreground">
            Students appear here automatically when an admission is confirmed.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !fetchError && students.length > 0 && (
        <StudentTable
          students={students}
          onDelete={handleDelete}
          onEdit={(student) => setEditStudent(student)}
        />
      )}

      {/* Create modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl border bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Add New Student</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <StudentForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editStudent && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setEditStudent(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl border bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Edit Student</h2>
              <button onClick={() => setEditStudent(null)} className="rounded-lg p-1.5 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <StudentForm
                onSubmit={handleUpdate}
                onCancel={() => setEditStudent(null)}
                defaultValues={{
                  name:        editStudent.name,
                  email:       editStudent.email,
                  phone:       editStudent.phone,
                  parentName:  editStudent.parentName,
                  parentPhone: editStudent.parentPhone,
                  grade:       editStudent.grade,
                  address:     editStudent.address,
                  dob:         editStudent.dob,
                  subjects:    [],
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}