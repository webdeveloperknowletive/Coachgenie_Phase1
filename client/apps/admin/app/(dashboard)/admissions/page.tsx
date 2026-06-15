"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  FileCheck, Clock, CheckCircle, XCircle, Plus, X, ChevronRight, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLeadStore } from "@/lib/stores/leads.store";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { Admission } from "@/lib/types/lead";

// ─── Types ─────────────────────────────────────────────────────────────────────
 type PaymentMode   = "upi" | "cash" | "bank" | "other";
 type PaymentStatus = "PENDING" | "PARTIAL" | "FULL";

 interface InstallmentSchedule {
  number:  number;
  amount:  number;
  dueDate: string;
  paid:    boolean;
}

 interface AdmissionPayment {
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

type AdmissionWithPayment = Admission & {
  payment?: AdmissionPayment;
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  Admission["status"],
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  PENDING_DOCS:   { label: "Pending Docs",   color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock       },
  DOCS_SUBMITTED: { label: "Docs Submitted", color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: FileCheck   },
  FEE_PENDING:    { label: "Fee Pending",    color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",  icon: Clock       },
  CONFIRMED:      { label: "Confirmed",      color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle },
  CANCELLED:      { label: "Cancelled",      color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     icon: XCircle     },
};

 const REQUIRED_DOCUMENTS = [
  { id: "aadhar",    label: "Aadhar Card",         required: true  },
  { id: "marksheet", label: "Previous Marksheet",  required: true  },
  { id: "photo",     label: "Passport Photo",       required: true  },
  { id: "tc",        label: "Transfer Certificate", required: false },
  { id: "address",   label: "Address Proof",        required: false },
  { id: "birth",     label: "Birth Certificate",    required: false },
];

// ─── Board options ─────────────────────────────────────────────────────────────
const BOARDS = [
  { value: "",      label: "— Select Board —" },
  { value: "CBSE",  label: "CBSE"             },
  { value: "ICSE",  label: "ICSE / ISC"       },
  { value: "STATE", label: "State Board"       },
  { value: "IB",    label: "IB"               },
  { value: "IGCSE", label: "IGCSE / Cambridge" },
  { value: "NIOS",  label: "NIOS"             },
  { value: "OTHER", label: "Other"            },
];

// ─── API helpers ───────────────────────────────────────────────────────────────
const API = "/api/proxy"

function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}


function derivePaymentStatus(paid: number, total: number): PaymentStatus {
  if (!total || paid <= 0) return "PENDING";
  if (paid >= total) return "FULL";
  return "PARTIAL";
}

function buildInstallmentSchedule(remaining: number, count: number, dates: string[]): InstallmentSchedule[] {
  if (!count) return [];
  const base  = Math.floor(remaining / count);
  const extra = remaining - base * count;
  return Array.from({ length: count }, (_, i) => ({
    number:  i + 1,
    amount:  i === 0 ? base + extra : base,
    dueDate: dates[i] ?? "",
    paid:    false,
  }));
}

// ─── Form state ────────────────────────────────────────────────────────────────
interface AddFormState {
  studentName:          string;
  batchName:            string;
  grade:                string;
  boardName:            string;
  phone:                string;
  email:                string;
  parentName:           string;
  parentPhone:          string;
  schoolName:           string;
  totalFee:             string;
  amountPaid:           string;
  dateOfPayment:        string;
  modeOfPayment:        PaymentMode;
  hasInstallments:      boolean;
  numberOfInstallments: number;
  installmentDates:     string[];
  notes:                string;
  selectedDocs:         string[];
  subjects:             string[];
}

const DEFAULT_FORM: AddFormState = {
  studentName:          "",
  batchName:            "",
  grade:                "",
  boardName:            "",
  phone:                "",
  email:                "",
  parentName:           "",
  parentPhone:          "",
  schoolName:           "",
  totalFee:             "",
  amountPaid:           "",
  dateOfPayment:        new Date().toISOString().split("T")[0],
  modeOfPayment:        "upi",
  hasInstallments:      false,
  numberOfInstallments: 2,
  installmentDates:     [],
  notes:                "",
  selectedDocs:         ["aadhar", "marksheet", "photo"],
  subjects:             [],
};

// ─── Add Admission Modal ───────────────────────────────────────────────────────
interface AddAdmissionModalProps {
  onClose:  () => void;
  onSave:   (data: AddFormState) => void;
  isSaving: boolean;
  batches:  { id: string; name: string;subjects: string[]  }[];
}

function AddAdmissionModal({ onClose, onSave, isSaving, batches }: AddAdmissionModalProps) {
  const [form, setForm] = useState<AddFormState>(DEFAULT_FORM);

  const totalFee   = parseFloat(form.totalFee) || 0;
  const amountPaid = parseFloat(form.amountPaid) || 0;
  const remaining  = Math.max(0, totalFee - amountPaid);
  const payStatus  = derivePaymentStatus(amountPaid, totalFee);
  const instAmt    = form.hasInstallments && form.numberOfInstallments > 0 && remaining > 0
    ? Math.ceil(remaining / form.numberOfInstallments) : 0;

  function setInstCount(n: number) {
    setForm(f => ({
      ...f,
      numberOfInstallments: n,
      installmentDates: Array.from({ length: n }, (_, i) => f.installmentDates[i] ?? ""),
    }));
  }

  function setInstDate(i: number, val: string) {
    setForm(f => { const d = [...f.installmentDates]; d[i] = val; return { ...f, installmentDates: d }; });
  }

  function toggleInstallments(checked: boolean) {
    setForm(f => ({
      ...f,
      hasInstallments:  checked,
      installmentDates: checked
        ? Array.from({ length: f.numberOfInstallments }, (_, i) => f.installmentDates[i] ?? "")
        : [],
    }));
  }

  function toggleDoc(docId: string) {
    setForm(f => ({
      ...f,
      selectedDocs: f.selectedDocs.includes(docId)
        ? f.selectedDocs.filter(d => d !== docId)
        : [...f.selectedDocs, docId],
    }));
  }

  function handleSubmit() {
    if (!form.studentName.trim()) { toast.error("Student name is required"); return; }
    onSave(form);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border bg-background shadow-2xl">

        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <h2 className="text-lg font-semibold">Add New Admission</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1">
          <div className="space-y-5">

            {/* ── Student Info ─────────────────────────────────────── */}
            <SectionDivider label="Student Information" />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Student Name *">
                <input value={form.studentName}
                  onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                  className={inputCls()} placeholder="e.g. Arjun Verma" />
              </Field>
              <Field label="Grade / Class">
                <input value={form.grade}
                  onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  className={inputCls()} placeholder="e.g. 12" />
              </Field>
              {/* <Field label="Standard">
                <input value={form.standard}
                  onChange={e => setForm(f => ({ ...f, standard: e.target.value }))}
                  className={inputCls()} placeholder="e.g. 10th, 11th, 12th" />
              </Field> */}
              <Field label="Board Name">
                <select value={form.boardName}
                  onChange={e => setForm(f => ({ ...f, boardName: e.target.value }))}
                  className={inputCls()}>
                  {BOARDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </Field>
              <Field label="School Name">
                <input value={form.schoolName}
                  onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))}
                  className={inputCls()} placeholder="e.g. Delhi Public School" />
              </Field>
              {/* <Field label="Batch Name">
                <select value={form.batchName}
                  onChange={e => setForm(f => ({ ...f, batchName: e.target.value }))}
                  className={inputCls()}>
                  <option value="">— Select Batch —</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </Field> */}
              <Field label="Batch Name">
                <select value={form.batchName}
                  onChange={e => {
                    const selectedName = e.target.value;
                    const selectedBatch = batches.find(b => b.name === selectedName);
                    const subjects = selectedBatch?.subjects?.filter(
                      (s: string) => s && s !== "N/A"
                    ) ?? [];
                    setForm(f => ({ ...f, batchName: selectedName, subjects }));
                  }}
                  className={inputCls()}>
                  <option value="">— Select Batch —</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </Field>
              {form.subjects.length > 0 && (
                <Field label="Subjects (from batch)">
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {form.subjects.map(s => (
                      <span key={s}
                        className="rounded-full bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </Field>
              )}
            </div>

            {/* ── Contact Details ───────────────────────────────────── */}
            <SectionDivider label="Contact Details" />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Student Phone">
                <input value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className={inputCls()} placeholder="e.g. 9876543210" />
              </Field>
              <Field label="Student Email">
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={inputCls()} placeholder="e.g. arjun@gmail.com" />
              </Field>
              <Field label="Parent Name">
                <input value={form.parentName}
                  onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
                  className={inputCls()} placeholder="e.g. Ramesh Verma" />
              </Field>
              <Field label="Parent Phone">
                <input value={form.parentPhone}
                  onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))}
                  className={inputCls()} placeholder="e.g. 9876543210" />
              </Field>
            </div>

            {/* ── Payment Details ───────────────────────────────────── */}
            <SectionDivider label="Payment Details" />

            <div className="grid grid-cols-3 gap-4">
              <Field label="Total Fee (₹)">
                <input type="number" min="0" value={form.totalFee}
                  onChange={e => setForm(f => ({ ...f, totalFee: e.target.value }))}
                  className={inputCls()} placeholder="50000" />
              </Field>
              <Field label="Amount Paid (₹)">
                <input type="number" min="0" value={form.amountPaid}
                  onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))}
                  className={inputCls()} placeholder="20000" />
              </Field>
              <Field label="Remaining (₹)">
                <div className={cn(inputCls(), "bg-muted text-muted-foreground select-none")}>
                  {remaining > 0 ? `₹${remaining.toLocaleString("en-IN")}` : "—"}
                </div>
              </Field>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Payment status:</span>
              <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full",
                payStatus === "FULL"    && "bg-emerald-100 text-emerald-700",
                payStatus === "PARTIAL" && "bg-amber-100 text-amber-700",
                payStatus === "PENDING" && "bg-red-100 text-red-700",
              )}>
                {payStatus === "FULL" ? "Full Payment" : payStatus === "PARTIAL" ? "Partially Paid" : "Pending"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of Payment">
                <input type="date" value={form.dateOfPayment}
                  onChange={e => setForm(f => ({ ...f, dateOfPayment: e.target.value }))}
                  className={inputCls()} />
              </Field>
              <Field label="Mode of Payment">
                <select value={form.modeOfPayment}
                  onChange={e => setForm(f => ({ ...f, modeOfPayment: e.target.value as PaymentMode }))}
                  className={inputCls()}>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>

            {/* ── Installments ──────────────────────────────────────── */}
            <SectionDivider label="Installments" />

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.hasInstallments}
                onChange={e => toggleInstallments(e.target.checked)}
                className="h-4 w-4 rounded accent-primary" />
              <span className="text-sm font-medium">Pay in installments</span>
            </label>

            {form.hasInstallments && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Number of Installments">
                    <select value={form.numberOfInstallments}
                      onChange={e => setInstCount(Number(e.target.value))}
                      className={inputCls()}>
                      {[2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n} installments</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Per Installment (₹)">
                    <div className={cn(inputCls(), "bg-muted text-muted-foreground select-none")}>
                      {instAmt > 0 ? `₹${instAmt.toLocaleString("en-IN")}` : "—"}
                    </div>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: form.numberOfInstallments }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">Installment {i + 1}</span>
                      <input type="date" value={form.installmentDates[i] ?? ""}
                        onChange={e => setInstDate(i, e.target.value)}
                        className={cn(inputCls(), "text-xs py-1.5")} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Documents ─────────────────────────────────────────── */}
            <SectionDivider label="Required Documents" />

            <div className="grid grid-cols-2 gap-2">
              {REQUIRED_DOCUMENTS.map((doc) => {
                const isSelected = form.selectedDocs.includes(doc.id);
                return (
                  <label key={doc.id}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                      isSelected ? "border-primary/40 bg-primary/5" : "hover:bg-accent",
                    )}>
                    <input type="checkbox" checked={isSelected}
                      onChange={() => toggleDoc(doc.id)}
                      className="h-4 w-4 rounded accent-primary shrink-0" />
                    <span className="text-sm flex-1 leading-tight">{doc.label}</span>
                    {doc.required
                      ? <span className="text-[10px] font-medium text-destructive border border-destructive/30 rounded px-1.5 py-0.5 shrink-0">Required</span>
                      : <span className="text-[10px] text-muted-foreground border rounded px-1.5 py-0.5 shrink-0">Optional</span>}
                  </label>
                );
              })}
            </div>

            <Field label="Payment Notes">
              <textarea value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className={cn(inputCls(), "resize-none h-auto")} rows={3}
                placeholder="Any notes..." />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4 shrink-0">
          <button onClick={onClose} disabled={isSaving}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSaving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
            {isSaving ? "Saving…" : "Save Admission"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AdmissionsPage() {
  const admissions   = useLeadStore((s) => s.admissions) as AdmissionWithPayment[];
  const addAdmission = useLeadStore((s) => s.addAdmission);

  const [filter,    setFilter]    = useState<Admission["status"] | "ALL">("ALL");
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [batches, setBatches] = useState<{ id: string; name: string; subjects: string[] }[]>([]);

  // ── fetch batches for dropdown ─────────────────────────────────────────────
useEffect(() => {
    async function load() {
      try {
        console.log("Fetching batches from:", `${API}/batches/`);
        console.log("Auth headers:", authHeaders());


        const res = await fetch(`${API}/batches`, { headers: authHeaders() });
        console.log("Batches response status:", res.status);
        if (!res.ok) {
          console.error("Batches fetch failed:", res.status, res.statusText);
          return;
        }
        const json = await res.json();
        console.log("Batches raw JSON:", json);
        const raw: any[] = Array.isArray(json) ? json : (json.data ?? json.items ?? []);
        console.log("Batches parsed:", raw);
        setBatches(raw.map(b => ({ id: String(b.id), name: b.name ?? "", subjects: b.subjects ?? [] })));
      } catch (e) {
        console.error("Batches fetch error:", e);
      }
    }
    load();
  }, []);

  const filtered = filter === "ALL" ? admissions : admissions.filter(a => a.status === filter);

  // REMOVE useCallback entirely - just use a regular async function
async function handleSave(data: AddFormState) {
    const foundBatch = batches.find(b => b.name === data.batchName);
    console.log("batches in handleSave:", batches);
    console.log("foundBatch:", foundBatch);


    // const authRaw     = localStorage.getItem("coachgenie-auth");
    // const authData    = authRaw ? JSON.parse(authRaw)?.state : null;
    // const accessToken = authData?.accessToken ?? useAuthStore.getState().accessToken;
    // const tenantId    = authData?.tenantId    ?? useAuthStore.getState().tenantId;

    // if (!accessToken || !tenantId) {
    //   toast.error("You must be logged in to create an admission.");
    //   return;
    // }

      
   

    const totalFee   = parseFloat(data.totalFee) || 0;
    const amountPaid = parseFloat(data.amountPaid) || 0;
    const remaining  = Math.max(0, totalFee - amountPaid);
    const payStatus  = derivePaymentStatus(amountPaid, totalFee);
    const instAmt    = data.hasInstallments && data.numberOfInstallments > 0 && remaining > 0
      ? Math.ceil(remaining / data.numberOfInstallments) : 0;
    const schedule   = buildInstallmentSchedule(
      remaining, data.hasInstallments ? data.numberOfInstallments : 0, data.installmentDates,
    );

    let admStatus: Admission["status"] = "PENDING_DOCS";
    if (payStatus === "FULL")         admStatus = "CONFIRMED";
    else if (payStatus === "PARTIAL") admStatus = "FEE_PENDING";

    const documents = REQUIRED_DOCUMENTS
      .filter(d => data.selectedDocs.includes(d.id))
      .map(d => ({ name: d.label, required: d.required, submitted: false }));

    const payload = {
      student_name: data.studentName,
      grade:        data.grade       || undefined,
      board_name:   data.boardName   || undefined,
      batch_id:     foundBatch?.id   || undefined,   // ← uses foundBatch directly
      batch_name:   data.batchName   || undefined,
      subjects:     data.subjects?.length ? data.subjects : undefined,
      phone:        data.phone       || undefined,
      email:        data.email       || undefined,
      parent_name:  data.parentName  || undefined,
      parent_phone: data.parentPhone || undefined,
      school_name:  data.schoolName  || undefined,
      status:       admStatus,
      documents,
      fee_amount:   totalFee,
      fee_paid:     amountPaid,
      payment: {
        totalFee, amountPaid, remaining,
        paymentStatus:        payStatus,
        dateOfPayment:        data.dateOfPayment,
        modeOfPayment:        data.modeOfPayment,
        hasInstallments:      data.hasInstallments,
        numberOfInstallments: data.numberOfInstallments,
        installmentAmount:    instAmt,
        installmentSchedule:  schedule,
        notes:                data.notes,
      } satisfies AdmissionPayment,
    };




    
    setSaving(true);
try {
  const res = await fetch(`${API}/admissions`, {   // ← /api/proxy/admissions
    method:  "POST",
    headers: authHeaders(),                         // ← just Content-Type, cookie is automatic
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    const message = typeof json?.detail === "string" ? json.detail
      : Array.isArray(json?.detail) ? json.detail.map((e: { msg: string }) => e.msg).join(", ")
      : "Failed to create admission";
    throw new Error(message);
  }
  const created: AdmissionWithPayment = json.data ?? json;
  addAdmission?.(created);
  toast.success("Admission created!");
  setShowForm(false);
} catch (err: unknown) {
  toast.error(err instanceof Error ? err.message : "Something went wrong");
} finally {
  setSaving(false);
}
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{admissions.length} total admissions</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Admission
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("ALL")}
          className={cn("rounded-full px-3 py-1 text-xs font-medium border transition-colors",
            filter === "ALL" ? "bg-foreground text-background" : "hover:bg-accent")}>
          All ({admissions.length})
        </button>
        {(Object.keys(STATUS_CONFIG) as Admission["status"][]).map((s) => {
          const cfg   = STATUS_CONFIG[s];
          const count = admissions.filter(a => a.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? "ALL" : s)}
              className={cn("rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                filter === s ? `${cfg.color} ${cfg.bg} ${cfg.border}` : "hover:bg-accent")}>
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-40 rounded-xl border bg-card text-sm text-muted-foreground">
            No admissions found.
          </div>
        )}
        {filtered.map((adm) => {
          const cfg        = STATUS_CONFIG[adm.status];
          const StatusIcon = cfg.icon;
          const docsTotal  = adm.documents.filter(d => d.required).length;
          const docsOk     = adm.documents.filter(d => d.required && d.submitted).length;
          return (
            <Link href={`/admissions/${adm.id}`} key={adm.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
                <StatusIcon className={cn("h-5 w-5", cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
  {adm.studentName ?? (adm as any).student_name ?? "—"}
</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    (adm as any).board_name,
                    (adm.subjects ?? []).filter((s: string) => s && s !== "N/A").join(", ")
                  ].filter(Boolean).join(" · ")}
                  {adm.payment?.hasInstallments && ` · ${adm.payment.numberOfInstallments} installments`}
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 text-xs">
                <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
                <span className="text-muted-foreground">
                  {docsTotal > 0 && `Docs: ${docsOk}/${docsTotal} · `}
                  {/* ₹{(adm.feePaid ?? adm.fee_paid ?? 0).toLocaleString("en-IN")} / ₹{(adm.feeAmount ?? adm.fee_amount ?? 0).toLocaleString("en-IN")} */}
                                  ₹{(adm.feePaid ?? (adm as any).fee_paid ?? 0).toLocaleString("en-IN")} / ₹{(adm.feeAmount ?? (adm as any).fee_amount ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="hidden md:block text-xs text-muted-foreground whitespace-nowrap">
                {adm.createdAt ? format(new Date(adm.createdAt), "dd MMM yyyy") : "—"}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

      {showForm && (
        <AddAdmissionModal
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          isSaving={saving}
          batches={batches}
        />
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function inputCls() {
  return "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
}

