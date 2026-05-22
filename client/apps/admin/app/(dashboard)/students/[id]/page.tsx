"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Phone, Mail, MapPin, User, BookOpen, Calendar, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EnrollmentDialog } from "@/components/students/EnrollmentDialog";

// ── API helpers ────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function authHeaders(): HeadersInit {
  const raw   = localStorage.getItem("coachgenie-auth");
  const state = raw ? JSON.parse(raw)?.state : null;
  const token    = state?.accessToken;
  const tenantId = state?.tenantId;
  return {
    "Content-Type": "application/json",
    ...(token    ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { "X-Tenant-Id": tenantId }          : {}),
  };
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE:  "bg-slate-100 text-slate-600 border-slate-200",
  SUSPENDED: "bg-red-50 text-red-600 border-red-200",
  GRADUATED: "bg-blue-50 text-blue-700 border-blue-200",
};

const TABS = [
  { label: "Overview",   href: "" },
  { label: "Attendance", href: "/attendance" },
  { label: "Exams",      href: "/exams" },
  { label: "Fees",       href: "/fees" },
];

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();

  const [student,    setStudent]    = useState<any>(null);
  const [batches,    setBatches]    = useState<any[]>([]);
  const [fees,       setFees]       = useState({ total: 0, paid: 0, due: 0 });
  const [loading,    setLoading]    = useState(true);
  const [feeLoading, setFeeLoading] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);

  // ── fetch student ──────────────────────────────────────────
  useEffect(() => {
    async function loadStudent() {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/students/${id}`, { headers: authHeaders() });
        if (!res.ok) return;
        const json = await res.json();
        const raw  = json.data ?? json;
        setStudent({
          id:          String(raw.id),
          name:        `${raw.first_name ?? ""} ${raw.last_name ?? ""}`.trim(),
          email:       raw.email         ?? "",
          phone:       raw.phone         ?? "",
          parentName:  raw.parent_name   ?? "",
          parentPhone: raw.parent_phone  ?? "",
          grade:       raw.current_class ?? "",
          subjects:    raw.subjects      ?? [],
          status:      raw.is_active === false ? "INACTIVE" : "ACTIVE",
          address:     raw.address       ?? "",
          dob:         raw.date_of_birth ?? "",
        });
      } catch {}
      finally { setLoading(false); }
    }
    loadStudent();
  }, [id]);


  useEffect(() => {
  async function loadBatches() {
    try {
      const res = await fetch(`${API}/batches/by-student/${id}`, { headers: authHeaders() });
      if (!res.ok) return;
      const json = await res.json();
      const raw: any[] = json.data ?? [];

      setBatches(raw.map(b => ({
        id:       String(b.id),
        name:     b.name         ?? "",
        teacher:  b.tutor_name   ?? "",
        room:     b.room_or_link ?? "",
        status:   b.is_active === false ? "COMPLETED" : "ACTIVE",
        subject:  b.target_exam  ?? "",
        schedule: b.schedule     ?? [],
      })));
    } catch {}
  }
  loadBatches();
}, [id, showEnroll]);

  // ── fetch fees ─────────────────────────────────────────────
  useEffect(() => {
    async function loadFees() {
      setFeeLoading(true);
      try {
        const res  = await fetch(`${API}/fees/student/${id}`, { headers: authHeaders() });
        if (!res.ok) return;
        const json = await res.json();
        const invoices: any[] = json.data ?? [];
        const total = invoices.reduce((s: number, i: any) => s + parseFloat(i.amount_due  ?? 0), 0);
        const paid  = invoices.reduce((s: number, i: any) => s + parseFloat(i.amount_paid ?? 0), 0);
        setFees({ total, paid, due: total - paid });
      } catch {}
      finally { setFeeLoading(false); }
    }
    loadFees();
  }, [id]);

  const feePercent = fees.total > 0 ? Math.round((fees.paid / fees.total) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );

  if (!student) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Student not found.</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push("/students")}
            className="mt-1 rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center text-xl font-bold text-primary">
              {student.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  STATUS_STYLE[student.status] ?? STATUS_STYLE.INACTIVE
                )}>
                  {student.status}
                </span>
                <span className="text-sm text-muted-foreground">{student.grade}</span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => setShowEnroll(true)}
          className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
          <BookOpen className="h-4 w-4" /> Manage Batches
        </button>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 border-b">
        {TABS.map(tab => (
          <Link key={tab.label} href={`/students/${id}${tab.href}`}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              tab.href === ""
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid gap-5 md:grid-cols-3">

        {/* Left col */}
        <div className="md:col-span-1 space-y-4">

          {/* Contact info */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Contact Info</h3>
            {[
              { icon: Mail,     value: student.email       || "Not Available" },
              { icon: Phone,    value: student.phone       || "Not Available" },
              { icon: User,     value: student.parentName  ? `${student.parentName} (Parent)` : "Not Available" },
              { icon: Phone,    value: student.parentPhone || "Not Available" },
              { icon: MapPin,   value: student.address     || "Not Available" },
              { icon: Calendar, value: student.dob && !isNaN(new Date(student.dob).getTime())
                  ? format(new Date(student.dob), "dd MMM yyyy")
                  : "Not Available" },
            ].map(({ icon: Icon, value }, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>

          {/* Fee summary */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Fee Summary</h3>
              {feeLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            {!feeLoading && fees.total === 0 ? (
              <p className="text-xs text-muted-foreground">No invoices raised yet.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {[
                    { label: "Total", value: `₹${fees.total.toLocaleString("en-IN")}` },
                    { label: "Paid",  value: `₹${fees.paid.toLocaleString("en-IN")}`,  green: true },
                    { label: "Due",   value: `₹${fees.due.toLocaleString("en-IN")}`,   red: fees.due > 0 },
                  ].map(({ label, value, green, red }: any) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={cn("font-medium", green && "text-emerald-600", red && "text-red-500")}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all",
                    feePercent === 100 ? "bg-emerald-500" : "bg-amber-500"
                  )} style={{ width: `${feePercent}%` }} />
                </div>
              </>
            )}
            <Link href={`/students/${id}/fees`}
              className="block text-center text-xs text-primary hover:underline">
              View Fee Ledger →
            </Link>
          </div>
        </div>

        {/* Right col */}
        <div className="md:col-span-2 space-y-4">

          {/* Enrolled batches — live from API */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Enrolled Batches</h3>
            {batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not enrolled in any batch.</p>
            ) : (
              <div className="space-y-3">
                {batches.map(b => (
                  <Link key={b.id} href={`/batches/${b.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors group">
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.subject}</p>
                      {b.schedule?.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {b.schedule.map((s: any) => `${s.day} ${s.start_time}–${s.end_time}`).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                      b.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    )}>
                      {b.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Subjects */}
          {/* <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Subjects</h3>
            {student.subjects?.length ? (
              <div className="flex flex-wrap gap-2">
                {student.subjects.map((s: string) => (
                  <span key={s}
                    className="rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-sm font-medium">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No subjects assigned.</p>
            )}
          </div> */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Subjects</h3>
            {(() => {
              const subjects = (student.subjects ?? []).filter((s: string) => s && s !== "N/A");
              return subjects.length ? (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s: string) => (
                    <span key={s}
                      className="rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subjects assigned.</p>
              );
            })()}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-4">
            <Link href={`/students/${id}/attendance`}
              className="rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/20 transition-all">
              <GraduationCap className="h-6 w-6 text-primary mb-3" />
              <p className="font-semibold">Attendance</p>
              <p className="text-xs text-muted-foreground mt-1">View monthly calendar →</p>
            </Link>
            <Link href={`/students/${id}/exams`}
              className="rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/20 transition-all">
              <BookOpen className="h-6 w-6 text-primary mb-3" />
              <p className="font-semibold">Exam Results</p>
              <p className="text-xs text-muted-foreground mt-1">View test history →</p>
            </Link>
          </div>
        </div>
      </div>

      {showEnroll && (
        <EnrollmentDialog
          studentId={id}
          studentName={student.name}
          onClose={() => setShowEnroll(false)}
        />
      )}
    </div>
  );
}