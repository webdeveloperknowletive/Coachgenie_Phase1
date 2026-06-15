"use client";
import { use, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Calendar, BookOpen, X, FileText, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAcademicStore } from "@/lib/stores/academic.store";
import { toast } from "sonner";
import type { Batch, BatchStatus } from "@/lib/types/academic";
import { authHeaders } from "@/lib/auth-headers";

const API = "/api/proxy"

function mapBatch(raw: any, existingSyllabus?: any[]): Batch {
  const status: BatchStatus = raw.is_active === false ? "COMPLETED" : "ACTIVE";
  return {
    id:         String(raw.id),
    name:       raw.name          ?? "",
    subject:    raw.target_exam   ?? raw.code ?? "",
    teacher:    raw.tutor_name    ?? "",
    grade:      raw.academic_year ?? "",
    status,
    room:       raw.room_or_link  ?? "",
    maxSize:    raw.capacity      ?? 50,
    studentIds: raw.student_ids   ?? [],
    schedule:   raw.schedule      ?? [],
    startDate:  raw.start_date    ?? "",
    endDate:    raw.end_date      ?? "",
    syllabus:   (raw.syllabus?.length ? raw.syllabus : null) ?? existingSyllabus ?? [],
    subjects:   raw.subjects      ?? [],
  };
}

function mapStudent(raw: any) {
  return {
    id:          String(raw.id),
    name:        `${raw.first_name ?? ""} ${raw.last_name ?? ""}`.trim(),
    email:       raw.email         ?? "",
    phone:       raw.phone         ?? "",
    parentName:  raw.parent_name   ?? "",
    parentPhone: raw.parent_phone  ?? "",
    grade:       raw.current_class ?? "",
    subjects:    raw.subjects      ?? [],
    batchIds:    raw.batch_ids     ?? [],
    status:      raw.is_active === false ? "INACTIVE" : "ACTIVE",
    address:     raw.address       ?? "",
    dob:         raw.date_of_birth ?? "",
    joinedAt:    raw.joined_at     ?? raw.created_at ?? new Date().toISOString(),
    fees:        { total: 0, paid: 0, due: 0 },
  };
}

function mapLead(raw: any) {
  return {
    id:       String(raw.id),
    name:     raw.full_name         ?? raw.name   ?? "",
    phone:    raw.phone             ?? "",
    email:    raw.email             ?? "",
    grade:    raw.grade             ?? "",
    standard: raw.standard          ?? "",
    board:    raw.board_name        ?? "",
    course:   raw.interested_course ?? raw.subject ?? "",
    stage:    (raw.status ?? "new").toUpperCase() as string,
    source:   raw.source            ?? "",
  };
}

async function fetchBatchStudents(batchId: string) {
  const res  = await fetch(`${API}/batches/${batchId}/students`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch students");
  const json = await res.json();
  const enrolled: any[] = Array.isArray(json) ? json : (json.data ?? []);
  return enrolled.map(mapStudent);
}

const STAGE_COLORS: Record<string, string> = {
  NEW:       "bg-slate-100 text-slate-700 border-slate-200",
  CONTACTED: "bg-blue-50 text-blue-700 border-blue-200",
  DEMO:      "bg-violet-50 text-violet-700 border-violet-200",
  ENROLLED:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOST:      "bg-red-50 text-red-600 border-red-200",
};

type Tab = "students" | "classes" | "leads" | "syllabus";

function ClassesTab({
  batchId, classes, setClasses, onMarkDone, batch,
}: {
  batchId: string;
  classes: any[];
  setClasses: React.Dispatch<React.SetStateAction<any[]>>;
  onMarkDone: (id: string) => void;
  batch: any;
}) {
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", scheduled_at: "", duration_min: "60", room_or_link: "", subject_id: "",
  });

  const subjects = useMemo(() =>
    (batch?.subjects ?? []).map((s: any, index: number) => ({
      id:   String(s?.id ?? s ?? index),
      name: s?.name ?? s?.title ?? s,
    })),
    [batch?.subjects]
  );

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduled_at) return toast.error("Title and date/time are required");
    if (!form.subject_id) return toast.error("Please select a subject");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/batches/classes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          batch_id:     batchId,
          subject_name: form.subject_id,
          tutor_id:     batch?.tutor_id ?? null,
          title:        form.title.trim(),
          scheduled_at: new Date(form.scheduled_at).toISOString(),
          duration_min: parseInt(form.duration_min) || 60,
          room_or_link: form.room_or_link.trim() || null,
          description:  null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? err.message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setClasses(prev => [...prev, json.data ?? json]);
      setForm({ title: "", scheduled_at: "", duration_min: "60", room_or_link: "", subject_id: "" });
      setShowForm(false);
      toast.success("Class scheduled");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to schedule class");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Classes ({classes.length})</h3>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Schedule Class
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSchedule} className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Class</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <input required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Kinematics — Class 1"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date & Time *</label>
              <input required type="datetime-local" value={form.scheduled_at}
                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Subject *</label>
              <select required value={form.subject_id}
                onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select subject...</option>
                {subjects.map((s: { id: string; name: string }, i: number) => (
  <option key={`${s.name}-${i}`} value={s.name}>
    {s.name}
  </option>
))}
              </select>
              {subjects.length === 0 && (
                <p className="text-xs text-amber-600">No subjects available in this batch</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Duration (minutes)</label>
              <input type="number" min="15" max="300" value={form.duration_min}
                onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Room / Link</label>
              <input value={form.room_or_link}
                onChange={e => setForm(f => ({ ...f, room_or_link: e.target.value }))}
                placeholder="Room 101 or meet.google.com/..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border px-4 py-1.5 text-sm hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {submitting ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {classes.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-8">No classes scheduled yet.</p>
        )}
        {classes.map((c: any, i: number) => (
          <div key={c.id ?? `class-${i}`}
            className="flex items-center justify-between rounded-lg border p-3 gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.title}</p>
              <p className="text-xs text-muted-foreground">
                {c.scheduled_at ? format(new Date(c.scheduled_at), "dd MMM, h:mm a") : "—"}
                {c.duration_min ? ` · ${c.duration_min} min` : ""}
                {c.room_or_link ? ` · ${c.room_or_link}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn(
                "text-[10px] font-medium rounded-full px-2 py-0.5 border",
                c.status === "completed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              )}>{c.status}</span>
              {c.status !== "completed" && (
                <button onClick={() => onMarkDone(String(c.id))}
                  className="rounded-md border px-2 py-1 text-[10px] hover:bg-accent transition-colors">Done</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  const store   = useAcademicStore();

  const [batch,     setBatch]     = useState<any>(store.batches.find(b => b.id === id) ?? null);
  const [students,  setStudents]  = useState<any[]>([]);
  const [classes,   setClasses]   = useState<any[]>([]);
  const [leads,     setLeads]     = useState<any[]>([]);
  const [syllabus,  setSyllabus]  = useState<any[]>([]);   // ← NEW
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("students");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1. Batch
        let currentBatch = store.batches.find(b => b.id === id);
        if (!currentBatch) {
          const bRes  = await fetch(`${API}/batches/`, { headers: authHeaders() });
          const bJson = await bRes.json();
          const raw: any[] = Array.isArray(bJson) ? bJson : (bJson.data ?? []);
          store.setBatches(raw.map((b: any) => {
            const existing = store.batches.find(x => String(x.id) === String(b.id));
            return mapBatch(b, existing?.syllabus);
          }));
          const found = raw.find((b: any) => String(b.id) === id);
          if (found) { currentBatch = mapBatch(found); setBatch(currentBatch); }
          else { setError("Batch not found"); setLoading(false); return; }
        } else {
          setBatch(currentBatch);
        }

        // 2. Classes
        const cRes = await fetch(`${API}/batches/${id}/classes`, { headers: authHeaders() });
        if (cRes.ok) {
          const cJson = await cRes.json();
          setClasses(Array.isArray(cJson) ? cJson : (cJson.data ?? []));
        }

        // 3. Students
        const enrolled = await fetchBatchStudents(id);
        setStudents(enrolled);

        // 4. Leads
        const lRes = await fetch(`${API}/leads/?batch_id=${id}`, { headers: authHeaders() });
        if (lRes.ok) {
          const lJson = await lRes.json();
          const rawLeads: any[] = Array.isArray(lJson) ? lJson : (lJson.data ?? lJson.items ?? []);
          setLeads(rawLeads.map(mapLead));
        }

        // 5. Syllabus ← NEW
        // const sRes = await fetch(`${API}/syllabus/${id}`, { headers: authHeaders() });
        // if (sRes.ok) {
        //   const sJson = await sRes.json();
        //   setSyllabus(sJson.data ?? []);
        // }

        try {
  const [batchRes, subjectsRes] = await Promise.all([
    fetch(`${API}/batches/${id}`, { headers: authHeaders() }),
    fetch(`${API}/batches/subjects`, { headers: authHeaders() }),
  ]);
  if (batchRes.ok && subjectsRes.ok) {
    const batchJson    = await batchRes.json();
    const subjectsJson = await subjectsRes.json();
    const batchData    = batchJson.data ?? batchJson;
    const allSubjects: any[] = subjectsJson.data ?? [];
    const batchSubjectNames  = new Set(
      (batchData.subjects ?? []).map((s: string) => s.toLowerCase().trim())
    );
    const matchedSubjects = allSubjects.filter(
      (s: any) => batchSubjectNames.has(s.name.toLowerCase().trim())
    );
    // Fetch syllabus for each matched subject
    const topicArrays = await Promise.all(
      matchedSubjects.map((s: any) =>
        fetch(`${API}/batches/${id}/syllabus?subject_id=${s.id}`, { headers: authHeaders() })
          .then(r => r.ok ? r.json() : { data: [] })
          .then(j => (j.data ?? []).map((t: any) => ({ ...t, subjectName: s.name })))
      )
    );
    setSyllabus(topicArrays.flat());
  }
} catch {
  // silent — syllabus is optional on this page
}

      } catch (err: any) {
        setError(err.message ?? "Failed to load batch");
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleEnroll(studentId: string) {
    try {
      const res = await fetch(`${API}/batches/${id}/enroll/${studentId}`, {
        method: "POST", headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to enroll student");
      toast.success("Student enrolled");
      setStudents(await fetchBatchStudents(id));
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleRemove(studentId: string) {
    try {
      const res = await fetch(`${API}/batches/${id}/enroll/${studentId}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to remove student");
      setStudents(prev => prev.filter(s => s.id !== studentId));
      toast.success("Student removed from batch");
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleMarkClassDone(classId: string) {
    try {
      const res = await fetch(`${API}/batches/classes/${classId}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Failed to update class");
      setClasses(prev => prev.map(c =>
        String(c.id) === classId ? { ...c, status: "completed" } : c
      ));
      toast.success("Class marked as completed");
    } catch (err: any) { toast.error(err.message); }
  }

  if (loading) return (
    <div className="space-y-4 max-w-5xl">
      <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
      </div>
      <div className="h-64 rounded-xl bg-muted animate-pulse" />
    </div>
  );

  if (error || !batch) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">{error ?? "Batch not found."}</p>
      <button onClick={() => router.push("/batches")}
        className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
        Back to Batches
      </button>
    </div>
  );

  // const completedTopics  = syllabus.filter((t: any) => t.completed).length;
  const completedTopics = syllabus.filter((t: any) => t.status === "completed").length;
  const syllabusProgress = syllabus.length > 0
    ? Math.round((completedTopics / syllabus.length) * 100) : 0;

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "students", label: "Students", count: students.length },
    { key: "classes",  label: "Classes",  count: classes.length  },
    { key: "leads",    label: "Leads",    count: leads.length    },
    { key: "syllabus", label: "Syllabus", count: syllabus.length },  // ← uses syllabus state
  ];

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push("/batches")}
            className="mt-1 rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{batch.name}</h1>
            <p className="text-sm text-muted-foreground">
              {batch.subject && `${batch.subject} · `}
              {batch.teacher && `${batch.teacher} · `}
              {batch.grade}
            </p>
          </div>
        </div>
        <Link href={`/batches/${id}/syllabus`}
          className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
          <BookOpen className="h-4 w-4" /> Syllabus
        </Link>
      </div>

      {/* Subjects pills */}
      {batch.subjects?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Subjects:</span>
          {batch.subjects.map((s: string) => (
            <span key={s} className="rounded-full bg-primary/10 text-primary text-xs px-2.5 py-0.5 font-medium border border-primary/20">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Students", value: `${students.length}/${batch.maxSize}`, icon: Users    },
          { label: "Classes",  value: `${classes.length} total`,             icon: Calendar },
          { label: "Leads",    value: `${leads.length} assigned`,            icon: FileText },
          { label: "Started",  value: batch.startDate
              ? format(new Date(batch.startDate), "dd MMM") : "—",           icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <Icon className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              activeTab === tab.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}>
            {tab.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Tab: Students */}
      {activeTab === "students" && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Enrolled Students ({students.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No students enrolled yet.</p>
            )}
            {students.map(s => (
              <div key={s.id}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group">
                <Link href={`/students/${s.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.grade}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium rounded-full px-2 py-0.5 border shrink-0",
                    s.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  )}>{s.status}</span>
                </Link>
                <button onClick={() => handleRemove(s.id)}
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Classes */}
      {activeTab === "classes" && (
        <ClassesTab batchId={id} classes={classes} setClasses={setClasses}
          onMarkDone={handleMarkClassDone} batch={batch} />
      )}

      {/* Tab: Leads */}
      {activeTab === "leads" && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Leads Assigned to This Batch ({leads.length})</h3>
            <Link href={`/leads?batch=${id}`} className="text-xs text-primary hover:underline">
              View all in Leads →
            </Link>
          </div>
          {leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-sm text-muted-foreground">No leads assigned to this batch yet.</p>
              <p className="text-xs text-muted-foreground">When adding a lead, select this batch from the Batch Name dropdown.</p>
            </div>
          )}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {leads.map(lead => (
              <Link key={lead.id} href={`/leads/${lead.id}`}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group">
                <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                  {lead.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[lead.phone, lead.grade, lead.standard, lead.board].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {lead.course && (
                  <span className="text-xs bg-muted rounded-full px-2.5 py-0.5 font-medium shrink-0 hidden sm:block">
                    {lead.course}
                  </span>
                )}
                <span className={cn(
                  "text-[10px] font-medium rounded-full px-2.5 py-0.5 border shrink-0",
                  STAGE_COLORS[lead.stage] ?? "bg-muted text-muted-foreground"
                )}>{lead.stage}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Syllabus */}
      {activeTab === "syllabus" && syllabus.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Syllabus Progress</h3>
            <span className="text-xs text-muted-foreground">{completedTopics}/{syllabus.length} topics</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-4">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${syllabusProgress}%` }} />
          </div>
          <div className="space-y-2">
            {syllabus.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <div className={cn(
  "h-4 w-4 rounded-full border-2 shrink-0",
  t.status === "completed" ? "bg-primary border-primary" : "border-muted-foreground/30"
)} />
<span className={t.status === "completed" ? "line-through text-muted-foreground" : ""}>{t.title}</span>
{t.subjectName && (
  <span className="ml-auto text-xs text-muted-foreground">{t.subjectName}</span>
)}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t">
            <Link href={`/batches/${id}/syllabus`} className="text-xs text-primary hover:underline">
              Manage Syllabus →
            </Link>
          </div>
        </div>
      )}

      {activeTab === "syllabus" && syllabus.length === 0 && (
        <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-sm text-muted-foreground">No syllabus topics added yet.</p>
          <Link href={`/batches/${id}/syllabus`} className="text-xs text-primary hover:underline">
            Manage Syllabus →
          </Link>
        </div>
      )}
    </div>
  );
}