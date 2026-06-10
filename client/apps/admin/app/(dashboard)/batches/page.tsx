"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Plus, X, RefreshCw, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAcademicStore } from "@/lib/stores/academic.store";
import type { Batch } from "@/lib/types/academic";

async function parseErrorDetail(res: Response): Promise<string> {
  const text = await res.text();
  try { return JSON.parse(text)?.detail ?? text; } catch { return text; }
}


// ── API helpers ────────────────────────────────────────────────
const API = "/api/proxy"

// ✅ FIX 1: Use localStorage + coachgenie-auth (matches the rest of the project)
function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}


/** Map raw API BatchOut → frontend Batch shape */
function mapBatch(raw: any): Batch {
  return {
    id:         String(raw.id),
    name:       raw.name          ?? "",
    subject:    raw.target_exam   ?? raw.code ?? "",
    teacher:    raw.tutor_name    ?? "",
    grade:      raw.academic_year ?? "",
    status:     raw.is_active === false ? "COMPLETED" : "ACTIVE",
    room:       raw.room_or_link  ?? "",
    maxSize:    raw.capacity      ?? 50,
    studentIds: raw.student_ids   ?? [],
    schedule:   raw.schedule      ?? [],
    startDate:  raw.start_date    ?? "",
    endDate:    raw.end_date      ?? "",
    syllabus:   raw.syllabus      ?? [],
    subjects:   raw.subjects      ?? [],
  };
}

const STATUS_STYLE: Record<Batch["status"], string> = {
  ACTIVE:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  UPCOMING:  "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-slate-100 text-slate-600 border-slate-200",
};

// ── Create / Edit Batch Form ───────────────────────────────────
interface BatchFormValues {
  name:          string;
  academic_year: string;
  target_exam:   string;
  capacity:      number;
  start_date:    string;
  end_date:      string;
  description:   string;
  code:          string;
  subjects:      string[];
}

function BatchForm({
  onSubmit, onCancel, defaultValues,
}: {
  onSubmit:       (data: BatchFormValues) => Promise<void>;
  onCancel:       () => void;
  defaultValues?: Partial<BatchFormValues>;
}) {
 const [form, setForm] = useState<BatchFormValues>({
    name:          defaultValues?.name          ?? "",
    academic_year: defaultValues?.academic_year ?? "2025-26",
    target_exam:   defaultValues?.target_exam   ?? "",
    capacity:      defaultValues?.capacity      ?? 30,
    start_date:    defaultValues?.start_date    ?? "",
    end_date:      defaultValues?.end_date      ?? "",
    description:   defaultValues?.description   ?? "",
    code:          defaultValues?.code          ?? "",
    subjects:      defaultValues?.subjects      ?? [],
  });
  const [subjectInput, setSubjectInput] = useState("");

  // function addSubject() {
  //   const s = subjectInput.trim();
  //   if (!s || form.subjects.includes(s)) return;
  //   setForm(f => ({ ...f, subjects: [...f.subjects, s] }));
  //   setSubjectInput("");
  // }
   function addSubject() {
    const parts = subjectInput.split(",").map(s => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setForm(f => ({
      ...f,
      subjects: [...f.subjects, ...parts.filter(p => !f.subjects.includes(p))],
    }));
    setSubjectInput("");
  }

  function removeSubject(s: string) {
    setForm(f => ({ ...f, subjects: f.subjects.filter(x => x !== s) }));
  }
  const [loading, setLoading] = useState(false);

  const field = (key: keyof BatchFormValues) => ({
    value:    form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await onSubmit(form); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-medium">Batch Name *</label>
          <input {...field("name")} required placeholder="e.g. JEE 2025 Batch A"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Academic Year *</label>
          <input {...field("academic_year")} required placeholder="e.g. 2025-26"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Batch Code</label>
          <input {...field("code")} placeholder="e.g. JEE-A"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Target Exam</label>
          <input {...field("target_exam")} placeholder="e.g. JEE, NEET"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Capacity</label>
          <input type="number" value={form.capacity}
            onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
            min={1} max={200}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Start Date</label>
          <input type="date" {...field("start_date")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">End Date</label>
          <input type="date" {...field("end_date")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        {/* <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-medium">Description</label>
          <textarea {...field("description")} rows={2} placeholder="Optional description…"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
        </div> */}
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-medium">Description</label>
          <textarea {...field("description")} rows={2} placeholder="Optional description…"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-medium">Subjects</label>
          <div className="flex gap-2">
            <input
              value={subjectInput}
              onChange={e => setSubjectInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubject(); } }}
              placeholder="e.g. Physics, Maths…"
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            <button type="button" onClick={addSubject}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
              Add
            </button>
          </div>
          {form.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {form.subjects.map(s => (
                <span key={s} className="flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-0.5 font-medium">
                  {s}
                  <button type="button" onClick={() => removeSubject(s)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {loading ? "Saving…" : "Save Batch"}
        </button>
      </div>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function BatchesPage() {
  const { batches, setBatches, addBatch, updateBatch: updateBatchStore } = useAcademicStore();

  const [statusFilter,  setStatusFilter]  = useState<Batch["status"] | "ALL">("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState<string | null>(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [editBatch,     setEditBatch]     = useState<Batch | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  // ── Fetch batches ──────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API}/batches/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await parseErrorDetail(res));
      const json = await res.json();
      const raw: any[] = Array.isArray(json) ? json : (json.data ?? json.items ?? []);
      setBatches(raw.map(mapBatch));
    } catch (err: any) {
      const msg = err.message ?? "Failed to load batches";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [setBatches]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  // ── Create ────────────────────────────────────────────────
  async function handleCreate(data: BatchFormValues) {
    try {
      const res = await fetch(`${API}/batches/`, {
        method:  "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name:          data.name,
          academic_year: data.academic_year,
          code:          data.code        || undefined,
          target_exam:   data.target_exam || undefined,
          description:   data.description || undefined,
          capacity:      data.capacity,
          start_date:    data.start_date  || undefined,
          end_date:      data.end_date    || undefined,
          // subjects:      data.subjects.length ? data.subjects : undefined,
          subjects:      data.subjects,
        }),
      });

      if (!res.ok) {
        const detail = await parseErrorDetail(res);
        toast.error(detail);
        return;
      }

      const json    = await res.json();
      const created = json.data ?? json;
      addBatch(mapBatch(created));
      toast.success("Batch created!");
      setShowCreate(false);
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    }
  }

  // ── Update ────────────────────────────────────────────────
  async function handleUpdate(data: BatchFormValues) {
    console.log("subjects being sent:", data.subjects, typeof data.subjects);
    if (!editBatch) return;
    try {
      const res = await fetch(`${API}/batches/${editBatch.id}`, {
        method:  "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          name:        data.name        || undefined,
          target_exam: data.target_exam || undefined,
          description: data.description || undefined,
          capacity:    data.capacity    || undefined,
          end_date:    data.end_date    || undefined,
          // subjects:    data.subjects.length ? data.subjects : undefined,
          subjects:    data.subjects,
        }),
      });

      if (!res.ok) {
        const detail = await parseErrorDetail(res);
        toast.error(detail);
        return;
      }

      const json    = await res.json();
      const updated = json.data ?? json;
      updateBatchStore(editBatch.id, mapBatch(updated));
      toast.success("Batch updated!");
      setEditBatch(null);
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    }
  }

  // ── Deactivate ────────────────────────────────────────────
  async function handleDeactivate(id: string) {
    try {
      const res = await fetch(`${API}/batches/${id}`, {
        method:  "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: false }),
      });
      if (!res.ok) {
        const detail = await parseErrorDetail(res);
        toast.error(detail);
        return;
      }
      updateBatchStore(id, { status: "COMPLETED" });
      toast.success("Batch deactivated");
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    }
  }

  async function handleGenerateReport(batch: Batch) {

    try {

      setGeneratingReport(batch.id);

      const response = await fetch(
        "http://127.0.0.1:8001/reports/batch-performance",
        {
          method: "POST",

          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            batch_data: {
              batch_id: batch.id,
              batch_name: batch.name,
            },
          }),
        }
      );

      if (!response.ok) {

        let errorMessage =
          "Failed to generate batch report";

        try {

          const err = await response.json();

          errorMessage =
            err.detail ||
            err.message ||
            errorMessage;

        } catch {}

        throw new Error(errorMessage);
      }

      // ✅ PDF BLOB
      const blob =
        await response.blob();

      // ✅ TEMP URL
      const url =
        window.URL.createObjectURL(blob);

      // ✅ DOWNLOAD LINK
      const a =
        document.createElement("a");

      a.href = url;

      a.download =
        `batch_report_${batch.name}_${Date.now()}.pdf`;

      document.body.appendChild(a);

      a.click();

      a.remove();

      // ✅ CLEANUP
      window.URL.revokeObjectURL(url);

      toast.success(
        "Batch report downloaded!"
      );

    } catch (err: any) {

      toast.error(
        err.message ??
        "Failed to generate report"
      );

    } finally {

      setGeneratingReport(null);
    }
  }

  // ── Filtered list ─────────────────────────────────────────
  const subjects = ["ALL", ...Array.from(new Set(batches.map(b => b.subject).filter(Boolean)))];
  const filtered = batches
    .filter(b => statusFilter  === "ALL" || b.status  === statusFilter)
    .filter(b => subjectFilter === "ALL" || b.subject === subjectFilter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Batches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${batches.length} total batches`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchBatches} disabled={loading}
            className="rounded-lg border p-2 hover:bg-accent transition-colors disabled:opacity-50" title="Refresh">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Batch
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-1.5 flex-wrap">
          {(["ALL","ACTIVE","UPCOMING","COMPLETED"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === s ? "bg-foreground text-background" : "hover:bg-accent")}>
              {s} ({s === "ALL" ? batches.length : batches.filter(b => b.status === s).length})
            </button>
          ))}
        </div>
        {subjects.length > 1 && (
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
            className="h-8 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && fetchError && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-16 text-center">
          <p className="text-sm text-destructive">{fetchError}</p>
          <button onClick={fetchBatches} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">No batches found</p>
          <p className="text-xs text-muted-foreground">Create your first batch to get started</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !fetchError && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(batch => {
            const syllabusCompleted = batch.syllabus.filter((t: any) => t.completed).length;
            const syllabusTotal     = batch.syllabus.length;
            const syllabusPct       = syllabusTotal > 0
              ? Math.round((syllabusCompleted / syllabusTotal) * 100) : 0;

            return (
              <div key={batch.id}
                className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold group-hover:text-primary transition-colors truncate">{batch.name}</p>
                    <p className="text-xs text-muted-foreground">{batch.teacher || batch.grade}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-medium", STATUS_STYLE[batch.status])}>
                      {batch.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />{batch.studentIds.length}/{batch.maxSize}
                    </span>
                    {batch.grade   && <span>{batch.grade}</span>}
                    {batch.room    && <span>{batch.room}</span>}
                    {batch.subject && <span className="rounded-md bg-muted px-2 py-0.5">{batch.subject}</span>}
                  </div>

                  {/* {batch.schedule.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {batch.schedule.map((s: any, i: number) => (
                        <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-[10px]">
                          {s.day} {s.time}
                        </span>
                      ))}
                    </div>
                  )} */}

                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(batch.schedule) &&
                    batch.schedule.length > 0 ? (
                      batch.schedule.map((s: any, i: number) => (
                        <span
                          key={i}
                          className="rounded-md bg-muted px-2 py-0.5 text-[10px]"
                        >
                          {s?.day || "N/A"} {s?.time || ""}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        No schedule
                      </span>
                    )}
                  </div>

                  {syllabusTotal > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Syllabus</span>
                        <span>{syllabusCompleted}/{syllabusTotal} topics</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${syllabusPct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Link href={`/batches/${batch.id}`}
                      className="flex-1 text-center rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                      View Details
                    </Link>
                    {/* Generate Report Button */}
                    <button
                      onClick={() => handleGenerateReport(batch)}
                      disabled={generatingReport === batch.id}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors flex items-center gap-1"
                    >
                      {generatingReport === batch.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Generating
                        </>
                      ) : (
                        <>
                          <FileText className="h-3 w-3" />
                          Report
                        </>
                      )}
                    </button>
                    <button onClick={() => setEditBatch(batch)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                      Edit
                    </button>
                    {batch.status !== "COMPLETED" && (
                      <button onClick={() => handleDeactivate(batch.id)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl border bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Create New Batch</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <BatchForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
            </div>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editBatch && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setEditBatch(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl border bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Edit Batch</h2>
              <button onClick={() => setEditBatch(null)} className="rounded-lg p-1.5 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <BatchForm
                onSubmit={handleUpdate}
                onCancel={() => setEditBatch(null)}
                defaultValues={{
                  name:        editBatch.name,
                  target_exam: editBatch.subject,
                  end_date:    editBatch.endDate,
                  capacity:    editBatch.maxSize,
                  subjects:    editBatch.subjects ?? [],
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

