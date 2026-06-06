// "use client";
// import { use, useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { ArrowLeft, Plus } from "lucide-react";
// import { format, parseISO, isValid } from "date-fns";
// import { toast } from "sonner";
// import { cn } from "@/lib/utils";

// const API = "/api/proxy"




const API = "/api/proxy"
// function authHeaders(): HeadersInit {
//   return { "Content-Type": "application/json" };
// }


// const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
//   paid:    { label: "Paid",    className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
//   pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
//   partial: { label: "Partial", className: "bg-blue-50 text-blue-600 border-blue-200" },
//   overdue: { label: "Overdue", className: "bg-red-50 text-red-600 border-red-200" },
// };

// const MODE_LABELS: Record<string, string> = {
//   cash: "Cash", upi: "UPI", bank_transfer: "Bank Transfer", cheque: "Cheque", card: "Card",
// };

// export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = use(params);
//   const router = useRouter();

//   const [invoice,      setInvoice]      = useState<any>(null);
//   const [payments,     setPayments]     = useState<any[]>([]);
//   const [loading,      setLoading]      = useState(true);
//   const [error,        setError]        = useState<string | null>(null);
//   const [showPaymentForm, setShowPaymentForm] = useState(false);
//   const [payAmount,    setPayAmount]    = useState("");
//   const [payMode,      setPayMode]      = useState("cash");
//   const [payRef,       setPayRef]       = useState("");
//   const [payNote,      setPayNote]      = useState("");
//   const [submitting,   setSubmitting]   = useState(false);
//   const [installments, setInstallments] = useState<{
//     label: string;
//     amount: number;
//     dueDate: string;
//     paid: boolean;
//   }[]>([]);

//   function safeFormat(dateStr: string) {
//     try {
//       const d = parseISO(dateStr);
//       return isValid(d) ? format(d, "dd MMM yyyy") : "—";
//     } catch { return "—"; }
//   }

//   async function load() {
//     setLoading(true);
//     try {
//       // 1. Fetch invoice
//       const invRes = await fetch(`${API}/fees/invoices`, { headers: authHeaders() });
//       if (!invRes.ok) throw new Error(`Failed to load invoices (${invRes.status})`);
//       const invJson = await invRes.json();
//       const list: any[] = Array.isArray(invJson) ? invJson : (invJson.data ?? []);
//       const found = list.find((i: any) => i.id === id);
//       if (!found) throw new Error("Invoice not found");
//       setInvoice(found);

//       // 2. Fetch payments first — we need count to reconcile installments
//       let fetchedPayments: any[] = [];
//       const payRes = await fetch(`${API}/fees/invoices/${id}/payments`, { headers: authHeaders() });
//       if (payRes.ok) {
//         const payJson = await payRes.json();
//         fetchedPayments = Array.isArray(payJson) ? payJson : (payJson.data ?? []);
//         setPayments(fetchedPayments);
//       }

//       // 3. Fetch installments from admissions and reconcile with actual payments
//       try {
//         const admRes = await fetch(
//           `${API}/admissions?student_id=${found.student_id}`,
//           { headers: authHeaders() }
//         );
//         if (admRes.ok) {
//           const admJson = await admRes.json();
//           const admList: any[] = Array.isArray(admJson) ? admJson : (admJson.data ?? []);

//           const admission =
//             admList.find((a: any) => a.student_id === found.student_id && a.payment_installment_schedule) ??
//             admList.find((a: any) => a.payment_installment_schedule) ??
//             null;

//           if (admission?.payment_installment_schedule) {
//             const sched =
//               typeof admission.payment_installment_schedule === "string"
//                 ? JSON.parse(admission.payment_installment_schedule)
//                 : admission.payment_installment_schedule;

//             const slots = sched?.installmentSchedule ?? [];

//             // Reconcile: mark installments as paid based on actual payment count
//             // Sort payments by paid_at ascending so we fill installments in order
//             const sortedPayments = [...fetchedPayments].sort(
//               (a, b) => new Date(a.paid_at ?? a.created_at).getTime() - new Date(b.paid_at ?? b.created_at).getTime()
//             );

//             // Calculate how many installments are covered by payments
//             // Each payment covers one installment (match by amount, in order)
//             let remainingPaid = parseFloat(found.amount_paid) || 0;

//             const reconciled = slots.map((s: any, i: number) => {
//               const instAmount = parseFloat(s.amount) || 0;
//               const isPaid = remainingPaid >= instAmount;
//               if (isPaid) remainingPaid -= instAmount;
//               return {
//                 label:   `Installment ${s.number ?? i + 1}`,
//                 amount:  instAmount,
//                 dueDate: s.dueDate ?? "",
//                 paid:    isPaid,
//               };
//             });

//             setInstallments(reconciled);
//           }
//         }
//       } catch {}

//     } catch (e: any) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => { load(); }, [id]);

//   async function handlePayment() {
//     if (!payAmount || parseFloat(payAmount) <= 0) return;
//     setSubmitting(true);
//     try {
//       const res = await fetch(`${API}/fees/invoices/${id}/pay`, {
//         method: "POST",
//         headers: authHeaders(),
//         body: JSON.stringify({
//           amount:          parseFloat(payAmount),
//           payment_mode:    payMode,
//           transaction_ref: payRef || null,
//           notes:           payNote || null,
//         }),
//       });
//       if (!res.ok) throw new Error("Payment failed");
//       toast.success("Payment recorded!");
//       setShowPaymentForm(false);
//       setPayAmount(""); setPayMode("cash"); setPayRef(""); setPayNote("");
//       await load();
//     } catch (e: any) {
//       toast.error(e.message);
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   if (loading) return (
//     <div className="space-y-4 max-w-4xl">
//       {[...Array(4)].map((_, i) => (
//         <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
//       ))}
//     </div>
//   );

//   if (error || !invoice) return (
//     <div className="flex flex-col items-center justify-center h-64 gap-3">
//       <p className="text-muted-foreground">{error ?? "Invoice not found."}</p>
//       <button onClick={() => router.push("/fees")} className="text-sm underline text-primary">
//         Back to Fees
//       </button>
//     </div>
//   );

//   const amountDue   = parseFloat(invoice.amount_due)  || 0;
//   const amountPaid  = parseFloat(invoice.amount_paid) || 0;
//   const outstanding = Math.max(0, amountDue - amountPaid);
//   const pct         = amountDue > 0 ? Math.min(100, Math.round((amountPaid / amountDue) * 100)) : 0;
//   const cfg         = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.pending;

//   const studentName =
//     (invoice.student_name ??
//       `${invoice.student?.first_name ?? ""} ${invoice.student?.last_name ?? ""}`.trim()) || "—";

//   const paidInstallments = installments.filter(i => i.paid).length;
//   const nextUnpaid       = installments.find(i => !i.paid);
//   const paidAmount       = installments.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);

//   return (
//     <div className="space-y-5 max-w-4xl">

//       {/* ── Header ── */}
//       <div className="flex items-start justify-between gap-4">
//         <div className="flex items-start gap-3">
//           <button
//             onClick={() => router.push("/fees")}
//             className="mt-1 rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors"
//           >
//             <ArrowLeft className="h-4 w-4" />
//           </button>
//           <div>
//             <h1 className="text-2xl font-bold">{invoice.invoice_no}</h1>
//             <div className="flex items-center gap-2 mt-1">
//               <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", cfg.className)}>
//                 {cfg.label}
//               </span>
//               <span className="text-sm text-muted-foreground">
//                 {studentName}{invoice.grade ? ` · ${invoice.grade}` : ""}
//               </span>
//             </div>
//           </div>
//         </div>
//         {outstanding > 0 && (
//           <button
//             onClick={() => setShowPaymentForm(true)}
//             className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
//           >
//             <Plus className="h-4 w-4" /> Record Payment
//           </button>
//         )}
//       </div>

//       {/* ── Main grid ── */}
//       <div className="grid gap-5 md:grid-cols-3">

//         {/* ── Left: summary + amounts ── */}
//         <div className="md:col-span-1 space-y-4">
//           <div className="rounded-xl border bg-card p-5 space-y-3">
//             <h3 className="text-sm font-semibold">Invoice Summary</h3>
//             {[
//               { label: "Invoice No", value: invoice.invoice_no },
//               { label: "Due Date",   value: safeFormat(invoice.due_date) },
//               { label: "Created",    value: safeFormat(invoice.created_at) },
//               { label: "Status",     value: cfg.label },
//             ].map(({ label, value }) => (
//               <div key={label}>
//                 <p className="text-xs text-muted-foreground">{label}</p>
//                 <p className="text-sm font-medium">{value}</p>
//               </div>
//             ))}
//           </div>

//           <div className="rounded-xl border bg-card p-5 space-y-3">
//             {[
//               { label: "Invoice Amount", value: `₹${amountDue.toLocaleString("en-IN")}`,   green: false, red: false },
//               { label: "Paid",           value: `₹${amountPaid.toLocaleString("en-IN")}`,  green: true,  red: false },
//               { label: "Outstanding",    value: `₹${outstanding.toLocaleString("en-IN")}`, green: false, red: outstanding > 0 },
//             ].map(({ label, value, green, red }) => (
//               <div key={label} className="flex justify-between text-sm">
//                 <span className="text-muted-foreground">{label}</span>
//                 <span className={cn("font-semibold", green && "text-emerald-600", red && "text-red-500")}>
//                   {value}
//                 </span>
//               </div>
//             ))}
//             <div className="pt-1">
//               <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
//                 <span>Progress</span><span>{pct}%</span>
//               </div>
//               <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
//                 <div
//                   className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-amber-500")}
//                   style={{ width: `${pct}%` }}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ── Right: installments + payment history ── */}
//         <div className="md:col-span-2 space-y-5">

//           {/* Installment Schedule */}
//           {installments.length > 0 && (
//             <div className="rounded-xl border bg-card p-5">
//               <div className="flex items-center justify-between mb-3">
//                 <h3 className="text-sm font-semibold">Installment Schedule</h3>
//                 <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
//                   {paidInstallments} / {installments.length} paid
//                 </span>
//               </div>

//               {/* Summary strip */}
//               <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mb-4">
//                 <span>
//                   Paid: <b className="text-foreground">₹{paidAmount.toLocaleString("en-IN")}</b>
//                 </span>
//                 <span>
//                   Remaining: <b className="text-red-500">₹{outstanding.toLocaleString("en-IN")}</b>
//                 </span>
//                 {nextUnpaid?.dueDate && (
//                   <span>
//                     Next due: <b className="text-foreground">{safeFormat(nextUnpaid.dueDate)}</b>
//                   </span>
//                 )}
//               </div>

//               {/* Installment cards */}
//               <div className="grid gap-3 sm:grid-cols-2">
//                 {installments.map((inst, idx) => {
//                   const isOverdue =
//                     !inst.paid &&
//                     inst.dueDate &&
//                     isValid(parseISO(inst.dueDate)) &&
//                     parseISO(inst.dueDate) < new Date();

//                   const statusKey = inst.paid ? "paid" : isOverdue ? "overdue" : "pending";

//                   return (
//                     <div
//                       key={idx}
//                       className={cn(
//                         "rounded-lg border p-3",
//                         inst.paid && "border-emerald-200 bg-emerald-50/30",
//                         isOverdue && !inst.paid && "border-red-200 bg-red-50/30"
//                       )}
//                     >
//                       <div className="flex items-center justify-between mb-1">
//                         <span className="text-xs text-muted-foreground">{inst.label}</span>
//                         <span className={cn(
//                           "rounded-full border px-2 py-0.5 text-[10px] font-medium",
//                           STATUS_CONFIG[statusKey].className
//                         )}>
//                           {STATUS_CONFIG[statusKey].label}
//                         </span>
//                       </div>
//                       <p className="text-base font-semibold">
//                         ₹{inst.amount.toLocaleString("en-IN")}
//                       </p>
//                       <p className="text-xs text-muted-foreground mt-0.5">
//                         {inst.paid ? "Paid" : "Due"}: {inst.dueDate ? safeFormat(inst.dueDate) : "—"}
//                       </p>
//                       {!inst.paid && outstanding > 0 && (
//                         <button
//                           onClick={() => {
//                             setPayAmount(String(inst.amount));
//                             setShowPaymentForm(true);
//                           }}
//                           className="mt-2 w-full rounded-md border px-2 py-1 text-xs hover:bg-accent transition-colors"
//                         >
//                           Mark as paid
//                         </button>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//           {/* Payment History */}
//           <div>
//             <h3 className="text-sm font-semibold mb-3">Payment History</h3>
//             {payments.length === 0 ? (
//               <div className="flex items-center justify-center h-40 rounded-xl border bg-card text-sm text-muted-foreground">
//                 No payments recorded yet.
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {payments.map((p: any) => (
//                   <div key={p.id} className="rounded-xl border bg-card p-4">
//                     <div className="flex items-start justify-between gap-4">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2">
//                           <span className="text-lg font-bold text-emerald-600">
//                             ₹{parseFloat(p.amount).toLocaleString("en-IN")}
//                           </span>
//                           {p.payment_mode && p.payment_mode !== "—" && (
//                             <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
//                               {MODE_LABELS[p.payment_mode] ?? p.payment_mode}
//                             </span>
//                           )}
//                         </div>
//                         <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
//                           <span>
//                             {p.paid_at || p.created_at ? safeFormat(p.paid_at ?? p.created_at) : "—"}
//                           </span>
//                           {p.transaction_ref && <span>Ref: {p.transaction_ref}</span>}
//                         </div>
//                         {p.notes && (
//                           <p className="text-xs text-muted-foreground mt-1 italic">{p.notes}</p>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//         </div>
//       </div>

//       {/* ── Record Payment modal ── */}
//       {showPaymentForm && (
//         <>
//           <div
//             className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
//             onClick={() => setShowPaymentForm(false)}
//           />
//           <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl border bg-background shadow-2xl p-6 space-y-4">
//             <h2 className="text-lg font-semibold">Record Payment</h2>
//             <p className="text-sm text-muted-foreground">
//               Outstanding: ₹{outstanding.toLocaleString("en-IN")}
//             </p>

//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-medium text-muted-foreground">Amount</label>
//                 <input
//                   type="number"
//                   value={payAmount}
//                   onChange={e => setPayAmount(e.target.value)}
//                   placeholder={`Max ₹${outstanding}`}
//                   className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
//                 />
//               </div>
//               <div>
//                 <label className="text-xs font-medium text-muted-foreground">Mode</label>
//                 <select
//                   value={payMode}
//                   onChange={e => setPayMode(e.target.value)}
//                   className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
//                 >
//                   {Object.entries(MODE_LABELS).map(([v, l]) => (
//                     <option key={v} value={v}>{l}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs font-medium text-muted-foreground">Reference (optional)</label>
//                 <input
//                   value={payRef}
//                   onChange={e => setPayRef(e.target.value)}
//                   className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
//                 />
//               </div>
//               <div>
//                 <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
//                 <input
//                   value={payNote}
//                   onChange={e => setPayNote(e.target.value)}
//                   className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
//                 />
//               </div>
//             </div>

//             <div className="flex gap-2 justify-end pt-2">
//               <button
//                 onClick={() => setShowPaymentForm(false)}
//                 className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handlePayment}
//                 disabled={submitting}
//                 className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
//               >
//                 {submitting ? "Saving…" : "Record Payment"}
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }


"use client";
import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = "/api/proxy";


function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}



const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  partial: { label: "Partial", className: "bg-blue-50 text-blue-600 border-blue-200" },
  overdue: { label: "Overdue", className: "bg-red-50 text-red-600 border-red-200" },
};

const MODE_LABELS: Record<string, string> = {
  cash: "Cash", upi: "UPI", bank_transfer: "Bank Transfer", cheque: "Cheque", card: "Card",

  const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200"      },
    partial: { label: "Partial", className: "bg-blue-50 text-blue-600 border-blue-200"         },
    overdue: { label: "Overdue", className: "bg-red-50 text-red-600 border-red-200"            },
  };

const MODE_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  card: "Card",

};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();


  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("cash");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [installments, setInstallments] = useState < {
    label: string;
    amount: number;
    dueDate: string;
    paid: boolean;

    const [invoice, setInvoice] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [payAmount, setPayAmount] = useState("");
    const [payMode, setPayMode] = useState("cash");
    const [payRef, setPayRef] = useState("");
    const [payNote, setPayNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [installments, setInstallments] = useState<{
      label: string;
      amount: number;
      dueDate: string;
      paid: boolean;

    }[]>([]);

    function safeFormat(dateStr: string) {
      try {
        const d = parseISO(dateStr);
  return isValid(d) ? format(d, "dd MMM yyyy") : "—";
} catch { return "—"; }
  }


async function load() {
  setLoading(true);
  try {
    // 1. Fetch invoice
    const invRes = await fetch(`${API}/fees/invoices`, { headers: authHeaders() });
    if (!invRes.ok) throw new Error(`Failed to load invoices (${invRes.status})`);
    const invJson = await invRes.json();
    const list: any[] = Array.isArray(invJson) ? invJson : (invJson.data ?? []);
    const found = list.find((i: any) => i.id === id);
    if (!found) throw new Error("Invoice not found");
    setInvoice(found);

    // 2. Fetch payments first — we need count to reconcile installments
    let fetchedPayments: any[] = [];
    const payRes = await fetch(`${API}/fees/invoices/${id}/payments`, { headers: authHeaders() });
    if (payRes.ok) {
      const payJson = await payRes.json();
      fetchedPayments = Array.isArray(payJson) ? payJson : (payJson.data ?? []);
      setPayments(fetchedPayments);
    }

    // 3. Fetch installments from admissions and reconcile with actual payments

    const load = useCallback(async () => {
      // setLoading(true);
      // setError(null);
      // try {
      //   // 1. Fetch invoice directly by ID
      //   const invRes = await fetch(`${API}/fees/invoices/${id}`, { headers: authHeaders() });
      //   if (!invRes.ok) throw new Error(`Failed to load invoice (${invRes.status})`);
      //   const invJson = await invRes.json();
      //   const found   = invJson.data ?? invJson;
      //   if (!found?.id) throw new Error("Invoice not found");
      //   setInvoice(found);
      setLoading(true);
      setError(null);
      try {
        // No GET /fees/invoices/{id} on backend — fetch all and find
        const invRes = await fetch(`${API}/fees/invoices`, { headers: authHeaders() });
        if (!invRes.ok) throw new Error(`Failed to load invoices (${invRes.status})`);
        const invJson = await invRes.json();
        const list: any[] = Array.isArray(invJson) ? invJson : (invJson.data ?? []);
        const found = list.find((i: any) => i.id === id);
        if (!found) throw new Error("Invoice not found");
        setInvoice(found);

        // 2. Fetch payments
        let fetchedPayments: any[] = [];
        const payRes = await fetch(`${API}/fees/invoices/${id}/payments`, { headers: authHeaders() });
        if (payRes.ok) {
          const payJson = await payRes.json();
          fetchedPayments = Array.isArray(payJson) ? payJson : (payJson.data ?? []);
          setPayments(fetchedPayments);
        }

        // 3. Fetch installment schedule from admissions and reconcile with payments

        try {
          const admRes = await fetch(
            `${API}/admissions?student_id=${found.student_id}`,
            { headers: authHeaders() }
          );
          if (admRes.ok) {

            const admJson = await admRes.json();

            const admJson = await admRes.json();

            const admList: any[] = Array.isArray(admJson) ? admJson : (admJson.data ?? []);

            const admission =
              admList.find((a: any) => a.student_id === found.student_id && a.payment_installment_schedule) ??
              admList.find((a: any) => a.payment_installment_schedule) ??
              null;

            if (admission?.payment_installment_schedule) {
              const sched =
                typeof admission.payment_installment_schedule === "string"
                  ? JSON.parse(admission.payment_installment_schedule)
                  : admission.payment_installment_schedule;


              const slots = sched?.installmentSchedule ?? [];

              // Reconcile: mark installments as paid based on actual payment count
              // Sort payments by paid_at ascending so we fill installments in order
              const sortedPayments = [...fetchedPayments].sort(
                (a, b) => new Date(a.paid_at ?? a.created_at).getTime() - new Date(b.paid_at ?? b.created_at).getTime()
              );

              // Calculate how many installments are covered by payments
              // Each payment covers one installment (match by amount, in order)

              const slots: any[] = sched?.installmentSchedule ?? [];

              // // Reconcile: mark installments paid by walking down amount_paid
              // let remainingPaid = parseFloat(found.amount_paid) || 0;

              // const reconciled = slots.map((s: any, i: number) => {
              //   const instAmount = parseFloat(s.amount) || 0;
              //   const isPaid     = remainingPaid >= instAmount;
              //   if (isPaid) remainingPaid -= instAmount;
              //   return {
              //     label:   `Installment ${s.number ?? i + 1}`,
              //     amount:  instAmount,
              //     dueDate: s.dueDate ?? "",
              //     paid:    isPaid,
              //   };
              // });
              // Replace the reconciliation block

              let remainingPaid = parseFloat(found.amount_paid) || 0;

              const reconciled = slots.map((s: any, i: number) => {
                const instAmount = parseFloat(s.amount) || 0;

                const isPaid = remainingPaid >= instAmount;

                const isPaid = remainingPaid >= instAmount;

                if (isPaid) remainingPaid -= instAmount;
                return {
                  label: `Installment ${s.number ?? i + 1}`,
                  amount: instAmount,
                  dueDate: s.dueDate ?? "",
                  paid: isPaid,
                };
              });

              setInstallments(reconciled);
            }
          }

        } catch { }

      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

  useEffect(() => { load(); }, [id]);

    async function handlePayment() {
      if (!payAmount || parseFloat(payAmount) <= 0) return;
      setSubmitting(true);
      try {
        const res = await fetch(`${API}/fees/invoices/${id}/pay`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            amount: parseFloat(payAmount),
            payment_mode: payMode,
            transaction_ref: payRef || null,

          } catch {
            // silent — installments are optional
          }

        } catch (e: any) {
          setError(e.message ?? "Something went wrong");
        } finally {
          setLoading(false);
        }
      }, [id]);

      useEffect(() => { load(); }, [load]);

      async function handlePayment() {
        const amount = parseFloat(payAmount);
        if (!payAmount || amount <= 0) {
          toast.error("Enter a valid amount");
          return;
        }

        const invAmountDue = parseFloat(invoice?.amount_due) || 0;
        const invAmountPaid = parseFloat(invoice?.amount_paid) || 0;
        const outstanding = Math.max(0, invAmountDue - invAmountPaid);

        if (amount > outstanding) {
          toast.error(`Amount cannot exceed outstanding ₹${outstanding.toLocaleString("en-IN")}`);
          return;
        }

        setSubmitting(true);
        try {
          const res = await fetch(`${API}/fees/invoices/${id}/pay`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              amount: amount,
              payment_mode: payMode,
              transaction_ref: payRef || null,

              notes: payNote || null,
            }),
          });
          if (!res.ok) throw new Error("Payment failed");
          toast.success("Payment recorded!");
          setShowPaymentForm(false);
          setPayAmount(""); setPayMode("cash"); setPayRef(""); setPayNote("");
          await load();
        } catch (e: any) {

          toast.error(e.message);

          toast.error(e.message ?? "Payment failed");

        } finally {
          setSubmitting(false);
        }
      }

      if (loading) return (
        <div className="space-y-4 max-w-4xl">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      );

      if (error || !invoice) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-muted-foreground">{error ?? "Invoice not found."}</p>
          <button onClick={() => router.push("/fees")} className="text-sm underline text-primary">
            Back to Fees
          </button>
        </div>
      );

      const amountDue = parseFloat(invoice.amount_due) || 0;
      const amountPaid = parseFloat(invoice.amount_paid) || 0;
      const outstanding = Math.max(0, amountDue - amountPaid);
      const pct = amountDue > 0 ? Math.min(100, Math.round((amountPaid / amountDue) * 100)) : 0;
      const cfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.pending;

      const studentName =
        (invoice.student_name ??
          `${invoice.student?.first_name ?? ""} ${invoice.student?.last_name ?? ""}`.trim()) || "—";

      const paidInstallments = installments.filter(i => i.paid).length;


      const effectivePaidInstallments = outstanding > 0
        ? installments.filter(i => i.paid).length
        : installments.length;

      const nextUnpaid = installments.find(i => !i.paid);
      const paidAmount = installments.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);

      return (
        <div className="space-y-5 max-w-4xl">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => router.push("/fees")}
                className="mt-1 rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{invoice.invoice_no}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", cfg.className)}>
                    {cfg.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {studentName}{invoice.grade ? ` · ${invoice.grade}` : ""}
                  </span>
                </div>
              </div>
            </div>
            {outstanding > 0 && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" /> Record Payment
              </button>
            )}
          </div>

          {/* ── Main grid ── */}
          <div className="grid gap-5 md:grid-cols-3">

            {/* ── Left: summary + amounts ── */}
            <div className="md:col-span-1 space-y-4">
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold">Invoice Summary</h3>
                {[

                  { label: "Invoice No", value: invoice.invoice_no },
                  { label: "Due Date", value: safeFormat(invoice.due_date) },
                  { label: "Created", value: safeFormat(invoice.created_at) },
                  { label: "Status", value: cfg.label },

                  { label: "Invoice No", value: invoice.invoice_no },
                  { label: "Due Date", value: safeFormat(invoice.due_date) },
                  { label: "Created", value: safeFormat(invoice.created_at) },
                  { label: "Status", value: cfg.label },

                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-card p-5 space-y-3">
                {[

                  { label: "Invoice Amount", value: `₹${amountDue.toLocaleString("en-IN")}`, green: false, red: false },
                  { label: "Paid", value: `₹${amountPaid.toLocaleString("en-IN")}`, green: true, red: false },
                  { label: "Outstanding", value: `₹${outstanding.toLocaleString("en-IN")}`, green: false, red: outstanding > 0 },

                  { label: "Invoice Amount", value: `₹${amountDue.toLocaleString("en-IN")}`, green: false, red: false },
                  { label: "Paid", value: `₹${amountPaid.toLocaleString("en-IN")}`, green: true, red: false },
                  { label: "Outstanding", value: `₹${outstanding.toLocaleString("en-IN")}`, green: false, red: outstanding > 0 },

                ].map(({ label, value, green, red }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cn("font-semibold", green && "text-emerald-600", red && "text-red-500")}>
                      {value}
                    </span>
                  </div>
                ))}



                          // Show a warning if status seems wrong
                {invoice.status === "overdue" && amountPaid >= amountDue && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                    ⚠ Fully paid but status not yet updated — refresh or contact admin.
                  </p>
                )}


                <div className="pt-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-amber-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: installments + payment history ── */}
            <div className="md:col-span-2 space-y-5">

              {/* Installment Schedule */}
              {installments.length > 0 && (
                <div className="rounded-xl border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Installment Schedule</h3>

                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                      {paidInstallments} / {installments.length} paid
                    </span>

                    {/* <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                  {paidInstallments} / {installments.length} paid
                </span> */}
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                      {effectivePaidInstallments} / {installments.length} paid
                    </span>

                  </div>

                  {/* Summary strip */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mb-4">
                    <span>
                      Paid: <b className="text-foreground">₹{paidAmount.toLocaleString("en-IN")}</b>
                    </span>
                    <span>
                      Remaining: <b className="text-red-500">₹{outstanding.toLocaleString("en-IN")}</b>
                    </span>
                    {nextUnpaid?.dueDate && (
                      <span>
                        Next due: <b className="text-foreground">{safeFormat(nextUnpaid.dueDate)}</b>
                      </span>
                    )}
                  </div>

                  {/* Installment cards */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {installments.map((inst, idx) => {
                      const isOverdue =
                        !inst.paid &&
                        inst.dueDate &&
                        isValid(parseISO(inst.dueDate)) &&
                        parseISO(inst.dueDate) < new Date();

                      const statusKey = inst.paid ? "paid" : isOverdue ? "overdue" : "pending";

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "rounded-lg border p-3",

                            inst.paid && "border-emerald-200 bg-emerald-50/30",

                            inst.paid && "border-emerald-200 bg-emerald-50/30",

                            isOverdue && !inst.paid && "border-red-200 bg-red-50/30"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{inst.label}</span>
                            <span className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                              STATUS_CONFIG[statusKey].className
                            )}>
                              {STATUS_CONFIG[statusKey].label}
                            </span>
                          </div>
                          <p className="text-base font-semibold">
                            ₹{inst.amount.toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">

                            {inst.paid ? "Paid" : "Due"}: {inst.dueDate ? safeFormat(inst.dueDate) : "—"}

                            {/* {inst.paid ? "Paid" : "Due"}: {inst.dueDate ? safeFormat(inst.dueDate) : "—"} */}
                            {inst.paid
                              ? `Paid: ${inst.paidAt ? safeFormat(inst.paidAt) : safeFormat(inst.dueDate)}`
                              : `Due: ${inst.dueDate ? safeFormat(inst.dueDate) : "—"}`}

                          </p>
                          {!inst.paid && outstanding > 0 && (
                            <button
                              onClick={() => {
                                setPayAmount(String(inst.amount));
                                setShowPaymentForm(true);
                              }}
                              className="mt-2 w-full rounded-md border px-2 py-1 text-xs hover:bg-accent transition-colors"
                            >
                              Mark as paid
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment History */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Payment History</h3>
                {payments.length === 0 ? (
                  <div className="flex items-center justify-center h-40 rounded-xl border bg-card text-sm text-muted-foreground">
                    No payments recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p: any) => (
                      <div key={p.id} className="rounded-xl border bg-card p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-emerald-600">
                                ₹{parseFloat(p.amount).toLocaleString("en-IN")}
                              </span>
                              {p.payment_mode && p.payment_mode !== "—" && (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                                  {MODE_LABELS[p.payment_mode] ?? p.payment_mode}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                              <span>
                                {p.paid_at || p.created_at ? safeFormat(p.paid_at ?? p.created_at) : "—"}
                              </span>
                              {p.transaction_ref && <span>Ref: {p.transaction_ref}</span>}
                            </div>
                            {p.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">{p.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── Record Payment modal ── */}
          {showPaymentForm && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowPaymentForm(false)}
              />
              <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl border bg-background shadow-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold">Record Payment</h2>
                <p className="text-sm text-muted-foreground">
                  Outstanding: ₹{outstanding.toLocaleString("en-IN")}
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Amount</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}

                      placeholder={`Max ₹${outstanding}`}

                      placeholder={`Max ₹${outstanding.toLocaleString("en-IN")}`}
                      max={outstanding}

                      className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Mode</label>
                    <select
                      value={payMode}
                      onChange={e => setPayMode(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
                    >
                      {Object.entries(MODE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Reference (optional)</label>
                    <input
                      value={payRef}
                      onChange={e => setPayRef(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
                    <input
                      value={payNote}
                      onChange={e => setPayNote(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={submitting}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Saving…" : "Record Payment"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }