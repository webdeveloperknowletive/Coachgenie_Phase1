"use client";
import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, IndianRupee, X,
  Calendar, FileText, RefreshCw, User,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Admission } from "@/lib/types/lead";

// ─── Types ────────────────────────────────────────────────────────────────────
export type PaymentMode   = "upi" | "cash" | "bank" | "other";
export type PaymentStatus = "PENDING" | "PARTIAL" | "FULL";

export interface InstallmentSchedule {
  number:  number;
  amount:  number;
  dueDate: string;
  paid:    boolean;
}

export interface AdmissionPayment {
  totalFee:             number;
  amountPaid:           number;
  remaining:            number;
  paymentStatus:        PaymentStatus;
  dateOfPayment:        string;
  modeOfPayment:        PaymentMode;
  hasInstallments:      boolean;
  numberOfInstallments: number;
  installmentAmount:    number;
  installmentSchedule:  InstallmentSchedule[];
  notes:                string;
}

export type AdmissionDetail = Admission & {
  student_name?:   string;
  fee_amount?:     number;
  fee_paid?:       number;
  created_at?:     string;
  approved_at?:    string;
  applied_course?: string;
  admission_number?: string;
  payment?:        AdmissionPayment;
  // ── new fields ──────────────────────────────────────────────────────────────
  // standard?:       string;
  board_name?:     string;
  batch_name?:     string;
  phone?:          string;
  parent_name?:    string;
  parent_phone?:   string;
  school_name?:    string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FLOW: Admission["status"][] = [
  "PENDING_DOCS", "DOCS_SUBMITTED", "FEE_PENDING", "CONFIRMED",
];

const STATUS_LABELS: Record<Admission["status"], string> = {
  PENDING_DOCS:   "Pending Documents",
  DOCS_SUBMITTED: "Documents Submitted",
  FEE_PENDING:    "Fee Pending",
  CONFIRMED:      "Confirmed",
  CANCELLED:      "Cancelled",
};

const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  upi:   "UPI",
  cash:  "Cash",
  bank:  "Bank Transfer",
  other: "Other",
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  FULL:    { label: "Full Payment",   className: "bg-emerald-100 text-emerald-700" },
  PARTIAL: { label: "Partially Paid", className: "bg-amber-100 text-amber-700"    },
  PENDING: { label: "Pending",        className: "bg-red-100 text-red-700"        },
};


const API = "/api/proxy";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return `₹${(n ?? 0).toLocaleString("en-IN")}`; }

function safeDate(val: string | undefined | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(val: string | undefined | null, fallback = "—") {
  const d = safeDate(val);
  return d ? format(d, "dd MMM yyyy") : fallback;
}

function derivePaymentStatus(paid: number, total: number): PaymentStatus {
  if (!total || paid <= 0) return "PENDING";
  if (paid >= total)       return "FULL";
  return "PARTIAL";
}

function buildInstallmentSchedule(remaining: number, count: number, dates: string[]): InstallmentSchedule[] {
  if (!count) return [];
  const base  = Math.floor(remaining / count);
  const extra = remaining - base * count;
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1, amount: i === 0 ? base + extra : base, dueDate: dates[i] ?? "", paid: false,
  }));
}

function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}


function EditPaymentModal({ payment, onClose, onSave }: EditPaymentModalProps) {
  const [totalFee,   setTotalFee]   = useState(String(payment.totalFee));
  const [amountPaid, setAmountPaid] = useState(String(payment.amountPaid));
  const [pdate,      setPdate]      = useState(payment.dateOfPayment ?? "");
  const [pmode,      setPmode]      = useState<PaymentMode>(payment.modeOfPayment ?? "upi");
  const [hasInst,    setHasInst]    = useState(payment.hasInstallments);
  const [instCount,  setInstCount]  = useState(payment.numberOfInstallments || 2);
  const [instDates,  setInstDates]  = useState<string[]>(payment.installmentSchedule.map(s => s.dueDate ?? ""));
  const [notes,      setNotes]      = useState(payment.notes ?? "");

  const total     = parseFloat(totalFee) || 0;
  const paid      = parseFloat(amountPaid) || 0;
  const remaining = Math.max(0, total - paid);
  const payStatus = derivePaymentStatus(paid, total);
  const instAmt   = hasInst && instCount > 0 && remaining > 0 ? Math.ceil(remaining / instCount) : 0;

  function handleInstCount(n: number) {
    setInstCount(n);
    setInstDates(prev => Array.from({ length: n }, (_, i) => prev[i] ?? ""));
  }

  function handleSave() {
    const schedule = buildInstallmentSchedule(remaining, hasInst ? instCount : 0, instDates);
    onSave({
      totalFee: total, amountPaid: paid, remaining, paymentStatus: payStatus,
      dateOfPayment: pdate, modeOfPayment: pmode, hasInstallments: hasInst,
      numberOfInstallments: hasInst ? instCount : 0, installmentAmount: instAmt,
      installmentSchedule: schedule, notes,
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <h2 className="text-lg font-semibold">Edit Payment Details</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Total Fee (₹)"><input type="number" min="0" value={totalFee} onChange={e => setTotalFee(e.target.value)} className={inputCls()} /></Field>
            <Field label="Amount Paid (₹)"><input type="number" min="0" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className={inputCls()} /></Field>
            <Field label="Remaining (₹)"><div className={cn(inputCls(), "bg-muted text-muted-foreground select-none")}>{remaining > 0 ? fmt(remaining) : "—"}</div></Field>
            {/* <Field label="Remaining (₹)"><div className={cn(inputCls(), "bg-muted text-muted-foreground select-none")}>{remaining > 0 ? fmt(remaining) : "—"}</div></Field> */}
            <Field label="Remaining (₹)">
  <div className={cn(inputCls(), "bg-muted text-muted-foreground select-none")}>
    {remaining > 0 ? `₹${remaining.toLocaleString("en-IN")}` : "₹0"}
  </div>
</Field>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Payment status:</span>
            <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", PAYMENT_STATUS_CONFIG[payStatus].className)}>{PAYMENT_STATUS_CONFIG[payStatus].label}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of Payment"><input type="date" value={pdate} onChange={e => setPdate(e.target.value)} className={inputCls()} /></Field>
            <Field label="Mode of Payment">
              <select value={pmode} onChange={e => setPmode(e.target.value as PaymentMode)} className={inputCls()}>
                <option value="upi">UPI</option><option value="cash">Cash</option><option value="bank">Bank Transfer</option><option value="other">Other</option>
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={hasInst} onChange={e => { setHasInst(e.target.checked); if (e.target.checked) setInstDates(Array.from({ length: instCount }, (_, i) => instDates[i] ?? "")); }} className="h-4 w-4 rounded accent-primary" />
            <span className="text-sm font-medium">Pay in installments</span>
          </label>
          {hasInst && (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Number of Installments">
                  <select value={instCount} onChange={e => handleInstCount(Number(e.target.value))} className={inputCls()}>
                    {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} installments</option>)}
                  </select>
                </Field>
                <Field label="Per Installment (₹)"><div className={cn(inputCls(), "bg-muted text-muted-foreground select-none")}>{instAmt > 0 ? fmt(instAmt) : "—"}</div></Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: instCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">Installment {i + 1}</span>
                    <input type="date" value={instDates[i] ?? ""} onChange={e => { const d = [...instDates]; d[i] = e.target.value; setInstDates(d); }} className={cn(inputCls(), "text-xs py-1.5")} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <Field label="Payment Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} className={cn(inputCls(), "resize-none h-auto")} rows={3} /></Field>
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4 shrink-0">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">Save Changes</button>
        </div>
      </div>
    </>
  );
}

// ─── Detail Page ──────────────────────────────────────────────────────────────
export default function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [adm,             setAdm]             = useState<AdmissionDetail | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [showEditPayment, setShowEditPayment] = useState(false);

  const fetchAdmission = useCallback(async () => {
    setLoading(true);
    try {

      const res  = await fetch(`/api/admissions/${id}`, { headers: authHeaders(), cache: "no-store" });
      const res  = await fetch(`${API}/admissions/${id}`, { headers: authHeaders(), cache: "no-store" });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setAdm(json.data ?? json);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load admission");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAdmission(); }, [fetchAdmission]);

  async function patchAdmission(patch: Record<string, any>) {
    setSaving(true);
    try {

      const res = await fetch(`/api/admissions/${id}`, {

      const res = await fetch(`${API}/admissions/${id}`, {

        method: "PATCH", headers: authHeaders(), body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail ?? "Failed to update admission");
      }
      await fetchAdmission();
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="space-y-4 max-w-4xl">
      <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
      <div className="h-32 rounded-xl bg-muted animate-pulse" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );

  if (!adm) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-lg font-semibold">Admission not found</p>
      <button onClick={() => router.push("/admissions")} className="text-sm text-primary hover:underline">← Back</button>
    </div>
  );

  const studentName = adm.studentName  ?? adm.student_name  ?? "—";
  const feeAmount   = adm.feeAmount    ?? adm.fee_amount     ?? 0;
  const feePaid     = adm.feePaid      ?? adm.fee_paid       ?? 0;
  const createdAt   = adm.createdAt    ?? adm.created_at;
  const approvedAt  = (adm as any).enrolledAt ?? (adm as any).approved_at ?? adm.approved_at;
  // const subjects    = adm.subjects?.length ? adm.subjects : adm.applied_course ? [adm.applied_course] : [];
  const appliedCourse = adm.applied_course && adm.applied_course !== "N/A" ? adm.applied_course : null;
  const subjects = adm.subjects?.length ? adm.subjects : appliedCourse ? [appliedCourse] : [];

  const payment: AdmissionPayment = adm.payment ?? {
    totalFee: feeAmount, amountPaid: feePaid, remaining: Math.max(0, feeAmount - feePaid),
    paymentStatus: derivePaymentStatus(feePaid, feeAmount),
    dateOfPayment: createdAt?.split("T")[0] ?? "", modeOfPayment: "upi" as PaymentMode,
    hasInstallments: false, numberOfInstallments: 0, installmentAmount: 0,
    installmentSchedule: [], notes: "",
  };

  const feePercent   = feeAmount > 0 ? Math.min(100, Math.round((feePaid / feeAmount) * 100)) : 0;
  const currentIdx   = STATUS_FLOW.indexOf(adm.status as typeof STATUS_FLOW[number]);
  const isConfirmed  = adm.status === "CONFIRMED";
  const requiredDocs = (adm.documents ?? []).filter(d => d.required);
  const allDocsOk    = requiredDocs.length > 0 && requiredDocs.every(d => d.submitted);
  const pendingCount = requiredDocs.filter(d => !d.submitted).length;
  const psCfg        = PAYMENT_STATUS_CONFIG[payment.paymentStatus] ?? PAYMENT_STATUS_CONFIG.PENDING;

  async function toggleDoc(name: string) {
    const updatedDocs = adm!.documents.map(d => d.name === name ? { ...d, submitted: !d.submitted } : d);
    await patchAdmission({ documents: updatedDocs });
    toast.success("Document status updated");
  }

  async function advanceStatus() {
    if (currentIdx === -1 || currentIdx === STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[currentIdx + 1]!;
    await patchAdmission({ status: next, enrolledAt: next === "CONFIRMED" ? new Date().toISOString() : undefined });
    toast.success(`Status → ${STATUS_LABELS[next]}`);
  }

  async function handlePaymentSave(updated: AdmissionPayment) {
    await patchAdmission({
      payment: updated, fee_amount: updated.totalFee, fee_paid: updated.amountPaid,
      status: updated.paymentStatus === "FULL" ? "CONFIRMED" : updated.paymentStatus === "PARTIAL" ? "FEE_PENDING" : adm!.status,
    });
    toast.success("Payment details updated");
    setShowEditPayment(false);
  }

  async function markInstallmentPaid(idx: number) {
    if (!payment.installmentSchedule.length) return;
    const updatedSchedule = payment.installmentSchedule.map((s, i) => i === idx ? { ...s, paid: true } : s);
    const instPaidTotal   = updatedSchedule.filter(s => s.paid).reduce((sum, s) => sum + s.amount, 0);
    const newAmountPaid   = Math.min(payment.totalFee, payment.amountPaid + instPaidTotal);
    const newPayment: AdmissionPayment = {
      ...payment, amountPaid: newAmountPaid, remaining: Math.max(0, payment.totalFee - newAmountPaid),
      paymentStatus: derivePaymentStatus(newAmountPaid, payment.totalFee), installmentSchedule: updatedSchedule,
    };
    await patchAdmission({ payment: newPayment, fee_paid: newAmountPaid });
    toast.success(`Installment ${idx + 1} marked as paid`);
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push("/admissions")}
            className="mt-0.5 rounded-lg p-2 hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{studentName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {[ adm.board_name, subjects.join(", "), adm.grade].filter(Boolean).join(" · ")}
              {adm.admission_number && (
                <span className="ml-2 text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{adm.admission_number}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAdmission} disabled={saving}
            className="rounded-lg border p-2 hover:bg-accent transition-colors disabled:opacity-50" title="Refresh">
            <RefreshCw className={cn("h-4 w-4", saving && "animate-spin")} />
          </button>
          {!isConfirmed && (
            <button onClick={advanceStatus} disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
              Advance to {STATUS_LABELS[STATUS_FLOW[currentIdx + 1] ?? "CONFIRMED"]}
            </button>
          )}
        </div>
      </div>

      {/* Progress stepper */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center">
          {STATUS_FLOW.map((s, i) => {
            const done   = currentIdx >= i;
            const active = currentIdx === i;
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                    done ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground")}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn("text-[10px] text-center max-w-[72px] leading-tight",
                    active ? "font-semibold text-primary" : "text-muted-foreground")}>
                    {STATUS_LABELS[s]}
                  </span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-2 mb-5 transition-colors", currentIdx > i ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Student Info card (NEW) ──────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <User className="h-4 w-4 text-muted-foreground" /> Student Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
          {[
            { label: "Grade",          value: adm.grade                                   },
            // { label: "Standard",       value: adm.standard                                },
            { label: "Board",          value: adm.board_name                              },
            { label: "Batch",          value: adm.batch_name,    highlight: true          },
            { label: "School",         value: adm.school_name                             },
            { label: "Phone",          value: adm.phone                                   },
            { label: "Parent",         value: adm.parent_name                             },
            { label: "Parent Phone",   value: adm.parent_phone                            },
            // { label: "Subjects",       value: subjects.join(", ")                         },
            { label: "Subjects", value: subjects.length ? subjects.join(", ") : "Not assigned" },
          ].map(({ label, value, highlight }) =>
            value ? (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                {highlight ? (
                  <span className="text-sm font-medium">
                    <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                      {value}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm font-medium">{value}</span>
                )}
              </div>
            ) : null
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">

        {/* Documents */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" /> Documents
            </h3>
            <span className="text-xs text-muted-foreground">
              {(adm.documents ?? []).filter(d => d.submitted).length}/{(adm.documents ?? []).length} submitted
            </span>
          </div>
          {(adm.documents ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No documents required yet</p>
          ) : (
            <div className="space-y-2">
              {adm.documents.map((doc) => (
                <label key={doc.name}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors">
                  <input type="checkbox" checked={doc.submitted} onChange={() => toggleDoc(doc.name)}
                    className="h-4 w-4 rounded border-input accent-primary" />
                  <span className={cn("text-sm flex-1", doc.submitted && "line-through text-muted-foreground")}>{doc.name}</span>
                  {doc.required
                    ? <span className="text-[10px] font-medium text-destructive">Required</span>
                    : <span className="text-[10px] text-muted-foreground">Optional</span>}
                  {doc.submitted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                </label>
              ))}
            </div>
          )}
          {pendingCount > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              ⚠ {pendingCount} required document{pendingCount !== 1 ? "s" : ""} pending
            </p>
          )}
          {(adm.documents ?? []).length > 0 && allDocsOk && (
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">✓ All required documents submitted</p>
          )}
        </div>

        {/* Fee summary */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <IndianRupee className="h-4 w-4 text-muted-foreground" /> Fee Summary
            </h3>
            <button onClick={() => setShowEditPayment(true)} className="text-xs text-primary hover:underline">Edit</button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", psCfg.className)}>{psCfg.label}</span>
            {payment.modeOfPayment && <span className="text-xs text-muted-foreground">via {PAYMENT_MODE_LABELS[payment.modeOfPayment]}</span>}
            {payment.dateOfPayment && <span className="text-xs text-muted-foreground">· {fmtDate(payment.dateOfPayment)}</span>}
          </div>
          <div className="space-y-2">
            {[
              { label: "Total Fee",   value: fmt(payment.totalFee)   },
              { label: "Fee Paid",    value: fmt(payment.amountPaid), green: true },
              { label: "Outstanding", value: fmt(payment.remaining),  red: payment.remaining > 0 },
            ].map(({ label, value, green, red }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={cn("font-semibold", green && "text-emerald-600", red && "text-red-500")}>{value}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Payment progress</span><span>{feePercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500",
                feePercent === 100 ? "bg-emerald-500" : feePercent >= 50 ? "bg-blue-500" : "bg-amber-500")}
                style={{ width: `${feePercent}%` }} />
            </div>
          </div>
          {payment.notes && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 italic">"{payment.notes}"</p>
          )}
          <div className="space-y-1 text-xs text-muted-foreground border-t pt-3">
            <div className="flex justify-between"><span>Created</span><span>{fmtDate(createdAt)}</span></div>
            {approvedAt && <div className="flex justify-between"><span>Enrolled</span><span className="text-emerald-600">{fmtDate(approvedAt)}</span></div>}
          </div>
        </div>
      </div>

      {/* Installment Schedule */}
      {payment.hasInstallments && payment.installmentSchedule.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Installment Schedule
            </h3>
            <span className="text-xs text-muted-foreground">
              {payment.installmentSchedule.filter(s => s.paid).length} / {payment.numberOfInstallments} paid
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {payment.installmentSchedule.map((inst, i) => {
              const dueDate   = inst.dueDate ?? (inst as any).due_date;
              const isOverdue = !inst.paid && dueDate && new Date(dueDate) < new Date();
              return (
                <div key={i} className={cn("rounded-lg border p-3 flex items-start justify-between gap-3 transition-all",
                  inst.paid ? "bg-emerald-50 border-emerald-200" : isOverdue ? "bg-red-50 border-red-200" : "bg-card")}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Installment {inst.number}</p>
                    <p className={cn("text-xs mt-0.5", inst.paid ? "text-emerald-600" : isOverdue ? "text-red-500" : "text-muted-foreground")}>
                      {fmtDate(dueDate, "No date set")}{isOverdue && " · Overdue"}
                    </p>
                    <p className="text-sm font-semibold mt-1">{fmt(inst.amount)}</p>
                  </div>
                  {inst.paid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <button onClick={() => markInstallmentPaid(i)} disabled={saving}
                      className={cn("shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                        isOverdue ? "bg-red-500 text-white hover:bg-red-600" : "border hover:bg-accent")}>
                      Mark paid
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
            <span>Paid: <span className="text-emerald-600 font-medium">{fmt(payment.installmentSchedule.filter(s => s.paid).reduce((sum, s) => sum + s.amount, 0))}</span></span>
            <span>Remaining: <span className="text-red-500 font-medium">{fmt(payment.installmentSchedule.filter(s => !s.paid).reduce((sum, s) => sum + s.amount, 0))}</span></span>
          </div>
        </div>
      )}

      {showEditPayment && (
        <EditPaymentModal payment={payment} onClose={() => setShowEditPayment(false)} onSave={handlePaymentSave} />
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function inputCls() {
  return "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
}