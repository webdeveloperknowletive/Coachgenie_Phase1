"use client";
import { useState, useEffect } from "react";
import { X, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = "/api/proxy"

function authHeaders(): HeadersInit {
  let token: string | null = null;
  let tenantId: string | null = null;
  try {
    const raw   = localStorage.getItem("coachgenie-auth");
    const state = raw ? JSON.parse(raw)?.state : null;
    token    = state?.accessToken ?? null;
    tenantId = state?.tenantId    ?? null;
  } catch {}
  return {
    "Content-Type": "application/json",
    ...(token    ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { "X-Tenant-Id": tenantId }          : {}),
  };
}

interface Student { id: string; name: string; grade: string; }
interface FeeStructure { id: string; name: string; total_amount: number; }

interface CreateInvoiceDialogProps {
  onClose:   () => void;
  onCreated: () => void; // parent calls load() to refresh
}

export function CreateInvoiceDialog({ onClose, onCreated }: CreateInvoiceDialogProps) {
  const [students,      setStudents]      = useState<Student[]>([]);
  const [structures,    setStructures]    = useState<FeeStructure[]>([]);
  const [loadingData,   setLoadingData]   = useState(true);
  const [saving,        setSaving]        = useState(false);

  const [studentId,       setStudentId]       = useState("");
  const [feeStructureId,  setFeeStructureId]  = useState("");
  const [invoiceNo,       setInvoiceNo]       = useState(`INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [amountDue,       setAmountDue]       = useState("");
  const [discount,        setDiscount]        = useState("0");
  const [dueDate,         setDueDate]         = useState("");
  const [description,     setDescription]     = useState("");

  // Pre-fill amount when fee structure selected
  useEffect(() => {
    if (!feeStructureId) return;
    const fs = structures.find(s => s.id === feeStructureId);
    if (fs) setAmountDue(String(fs.total_amount));
  }, [feeStructureId, structures]);

  // Fetch students + fee structures
  useEffect(() => {
    async function load() {
      setLoadingData(true);
      try {
        const [sRes, fRes] = await Promise.all([
          fetch(`${API}/students/`,          { headers: authHeaders() }),
          fetch(`${API}/fees/structures`,    { headers: authHeaders() }),
        ]);

        if (sRes.ok) {
          const j = await sRes.json();
          const raw: any[] = Array.isArray(j) ? j : (j.data ?? j.items ?? []);
          setStudents(raw.map(s => ({
            id:    String(s.id),
            name:  `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
            grade: s.current_class ?? "",
          })));
        }

        if (fRes.ok) {
          const j = await fRes.json();
          const raw: any[] = Array.isArray(j) ? j : (j.data ?? []);
          setStructures(raw.map(f => ({
            id:           String(f.id),
            name:         f.name,
            total_amount: parseFloat(f.total_amount) || 0,
          })));
        }
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!studentId)  return toast.error("Select a student");
    if (!amountDue)  return toast.error("Enter amount due");
    if (!dueDate)    return toast.error("Enter due date");
    if (!invoiceNo)  return toast.error("Enter invoice number");

    setSaving(true);
    try {
      const body: any = {
        student_id:  studentId,
        invoice_no:  invoiceNo,
        amount_due:  parseFloat(amountDue),
        discount:    parseFloat(discount) || 0,
        due_date:    dueDate,
      };
      if (feeStructureId) body.fee_structure_id = feeStructureId;

      const res = await fetch(`${API}/fees/invoices`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          Array.isArray(err.detail)
            ? err.detail.map((e: any) => e.msg).join(", ")
            : (err.detail ?? "Failed to create invoice")
        );
      }

      toast.success("Invoice created!");
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const netAmount = (parseFloat(amountDue) || 0) - (parseFloat(discount) || 0);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl border bg-background shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold">Create Invoice</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">

            {/* Student */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Student <span className="text-destructive">*</span></label>
              <select
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select student…</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.grade ? ` — ${s.grade}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Fee structure (optional) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Fee Structure
                <span className="ml-1 text-xs text-muted-foreground">(optional — auto-fills amount)</span>
              </label>
              <select
                value={feeStructureId}
                onChange={e => setFeeStructureId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">None</option>
                {structures.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} — ₹{f.total_amount.toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice No */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Invoice Number <span className="text-destructive">*</span></label>
              <input
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>

            {/* Amount + Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount Due (₹) <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={amountDue}
                  onChange={e => setAmountDue(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Net amount preview */}
            {(parseFloat(amountDue) > 0) && (
              <div className="rounded-lg bg-muted/50 px-4 py-3 flex justify-between text-sm">
                <span className="text-muted-foreground">Net payable</span>
                <span className="font-semibold">₹{netAmount.toLocaleString("en-IN")}</span>
              </div>
            )}

            {/* Due date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Due Date <span className="text-destructive">*</span></label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || loadingData}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving
              ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Creating…</>
              : <><Plus className="h-3.5 w-3.5" /> Create Invoice</>
            }
          </button>
        </div>
      </div>
    </>
  );
}

