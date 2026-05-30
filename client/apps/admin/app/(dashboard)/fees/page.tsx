"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { IndianRupee, TrendingUp, Clock, AlertCircle, RefreshCw, Search,
  ArrowUpDown, ChevronLeft, ChevronRight, Eye, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";

// ── API helpers ────────────────────────────────────────────────
const API = "/api/proxy"

function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}



// ── Types ──────────────────────────────────────────────────────
type Status = "paid" | "pending" | "overdue" | "partial";

interface RawInvoice {
  id:               string;
  invoice_no:       string;
  student_id:       string;
  amount_due:       string | number;
  amount_paid:      string | number;
  discount:         string | number;
  due_date:         string;
  status:           Status;
  created_at:       string;
  student_name?:    string;
  student?:         { first_name?: string; last_name?: string; current_class?: string };
  payment_installment_schedule?: string | null;
}

interface Invoice {
  id:          string;
  invoiceNo:   string;
  studentId:   string;
  studentName: string;
  grade:       string;
  amountDue:   number;
  amountPaid:  number;
  discount:    number;
  dueDate:     string;
  createdAt:   string;
  status:      Status;
   installmentMonths: string[];
}

interface Summary {
  total_collected?: number;
  total_outstanding?: number;
  total_invoices?: number;
  overdue_count?: number;
}

// ── Map raw API → typed invoice ────────────────────────────────
// function mapInvoice(r: RawInvoice): Invoice {
//   const firstName = r.student?.first_name ?? "";
//   const lastName  = r.student?.last_name  ?? "";
//   // const name = r.student_name ?? `${firstName} ${lastName}`.trim() || "—";
//   const name = r.student_name ?? (`${firstName} ${lastName}`.trim() || "—");

//   return {
//     id:          String(r.id),
//     invoiceNo:   r.invoice_no,
//     studentId:   String(r.student_id),
//     studentName: name,
//     grade:       r.student?.current_class ?? "",
//     amountDue:   parseFloat(String(r.amount_due))  || 0,
//     amountPaid:  parseFloat(String(r.amount_paid)) || 0,
//     discount:    parseFloat(String(r.discount))    || 0,
//     dueDate:     r.due_date,
//     createdAt:   r.created_at,
//     status:      r.status,
    
//   };
// }
function mapInvoice(r: RawInvoice): Invoice {
  const firstName = r.student?.first_name ?? "";
  const lastName  = r.student?.last_name  ?? "";
  const name = r.student_name ?? (`${firstName} ${lastName}`.trim() || "—");

  // Parse installment months from schedule JSON
  let installmentMonths: string[] = [];
  if (r.payment_installment_schedule) {
    try {
      const sched = typeof r.payment_installment_schedule === "string"
        ? JSON.parse(r.payment_installment_schedule)
        : r.payment_installment_schedule;
      const slots = sched?.installmentSchedule ?? [];
      installmentMonths = slots
        .map((s: any) => s.due_date?.slice(0, 7))  // "2026-06"
        .filter(Boolean);
    } catch {}
  }
  // Fallback to invoice due_date month if no installments
  if (installmentMonths.length === 0 && r.due_date) {
    installmentMonths = [r.due_date.slice(0, 7)];
  }

  return {
    id:                r.id,
    invoiceNo:         r.invoice_no,
    studentId:         String(r.student_id),
    studentName:       name,
    grade:             r.student?.current_class ?? "",
    amountDue:         parseFloat(String(r.amount_due))  || 0,
    amountPaid:        parseFloat(String(r.amount_paid)) || 0,
    discount:          parseFloat(String(r.discount))    || 0,
    dueDate:           r.due_date,
    createdAt:         r.created_at,
    status:            r.status,
    installmentMonths: r.due_date ? [r.due_date.slice(0, 7)] : [],  // ✅ new field
  };
}


// ── Status config ──────────────────────────────────────────────
const STATUS_CFG: Record<Status, { label: string; cls: string }> = {
  paid:    { label: "Paid",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  overdue: { label: "Overdue", cls: "bg-red-50 text-red-600 border-red-200" },
  partial: { label: "Partial", cls: "bg-blue-50 text-blue-600 border-blue-200" },
};

// ── Month options ──────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth(); // 0-indexed

// const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
//   const monthIdx = (currentMonth - i + 12) % 12;
//   const year     = currentMonth - i < 0 ? currentYear - 1 : currentYear;
//   return { label: `${MONTHS[monthIdx]} ${year}`, value: `${year}-${String(monthIdx + 1).padStart(2, "0")}` };
// });
const MONTH_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const date = new Date(currentYear, currentMonth - 6 + i); // 6 months back, 18 months forward
  const y = date.getFullYear();
  const m = date.getMonth();
  return {
    label: `${MONTHS[m]} ${y}`,
    value: `${y}-${String(m + 1).padStart(2, "0")}`,
  };
}).reverse(); // most recent first

// ── Page ───────────────────────────────────────────────────────
export default function FeesPage() {
  const [invoices,     setInvoices]     = useState<Invoice[]>([]);
  const [summary,      setSummary]      = useState<Summary>({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [monthFilter,  setMonthFilter]  = useState<string>("ALL");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [sortField,    setSortField]    = useState<keyof Invoice>("dueDate");
  const [sortDir,      setSortDir]      = useState<"asc" | "desc">("desc");
  const PAGE_SIZE = 10;

  // ── Fetch ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all invoices — your backend returns them from /fees/student/{id},
      // but for the main fees page we need all. Try /fees/invoices first, fall back.
      const [invRes, sumRes] = await Promise.all([
        fetch(`${API}/fees/invoices`, { headers: authHeaders() }),
        fetch(`${API}/fees/revenue/summary`, { headers: authHeaders() }),
      ]);

      if (invRes.ok) {
        const json = await invRes.json();
        const raw: RawInvoice[] = Array.isArray(json) ? json : (json.data ?? json.items ?? []);
        setInvoices(raw.map(mapInvoice));
      } else {
        setError(`Failed to load invoices (${invRes.status})`);
      }

      if (sumRes.ok) {
        const sJson = await sumRes.json();
        setSummary(sJson.data ?? sJson);
      }
    } catch (e: any) {
      setError(e.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats (fallback to client-computed if API summary is empty) ──
  // const totalCollected   = summary.total_collected   ?? invoices.reduce((s, i) => s + i.amountPaid, 0);
  // const totalOutstanding = summary.total_outstanding ?? invoices.reduce((s, i) => s + Math.max(0, i.amountDue - i.amountPaid), 0);
  // const overdueCount     = summary.overdue_count     ?? invoices.filter(i => i.status === "overdue").length;
  // const totalInvoices    = summary.total_invoices    ?? invoices.length;
  // ✅ AFTER — correct calculations
const totalCollected   = summary.total_collected   ?? invoices.reduce((s, i) => s + i.amountPaid, 0);
const totalOutstanding = summary.total_outstanding ?? invoices
  .filter(i => i.status !== "paid")
  .reduce((s, i) => s + Math.max(0, i.amountDue - i.amountPaid - i.discount), 0);
// const overdueCount     = summary.overdue_count     ?? invoices.filter(i => {
//   if (i.status === "paid") return false;
//   try { 
//     const d = parseISO(i.dueDate); 
//     return isValid(d) && d < new Date(); 
//   } catch { return false; }
// }).length;
const overdueCount = summary.overdue_count ?? invoices.filter(i => {
  if (i.status === "paid") return false;
  try { const d = parseISO(i.dueDate); return isValid(d) && d < new Date(); }
  catch { return false; }
}).length;
const totalInvoices    = summary.total_invoices    ?? invoices.length;

  const stats = [
    {
      label: "Total Collected",
      value: totalCollected >= 100000
        ? `₹${(totalCollected / 100000).toFixed(1)}L`
        : `₹${totalCollected.toLocaleString("en-IN")}`,
      sub:   `${invoices.filter(i => i.status === "paid").length} paid invoices`,
      icon:  CheckCircle2,
      color: "text-emerald-600",
      bg:    "bg-emerald-50",
      border:"border-emerald-100",
    },
    {
      label: "Outstanding",
      value: totalOutstanding >= 100000
        ? `₹${(totalOutstanding / 100000).toFixed(1)}L`
        : `₹${totalOutstanding.toLocaleString("en-IN")}`,
      sub:   `${invoices.filter(i => i.status === "partial").length} partial payments`,
      icon:  TrendingUp,
      color: "text-amber-600",
      bg:    "bg-amber-50",
      border:"border-amber-100",
    },
    {
      label: "Overdue",
      value: overdueCount.toString(),
      sub:   "invoices past due date",
      icon:  XCircle,
      color: "text-red-600",
      bg:    "bg-red-50",
      border:"border-red-100",
    },
    // {
    //   label: "Total Invoices",
    //   value: totalInvoices.toString(),
    //   sub:   `${invoices.filter(i => i.status === "pending").length} pending`,
    //   icon:  IndianRupee,
    //   color: "text-blue-600",
    //   bg:    "bg-blue-50",
    //   border:"border-blue-100",
    // },
    {
  label: "Total Invoices",
  value: totalInvoices.toString(),
  sub:   `${(summary as any).pending_count ?? invoices.filter(i => i.status === "pending").length} pending`,
  icon:  IndianRupee,
  color: "text-blue-600",
  bg:    "bg-blue-50",
  border:"border-blue-100",
},
  ];

  // ── Filter + sort + paginate ──────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...invoices];

    // if (statusFilter !== "ALL")
    //   list = list.filter(i => i.status === statusFilter);
    if (statusFilter !== "ALL") {
  if (statusFilter === "overdue") {
    // ✅ Filter by date, not status field
    list = list.filter(i => {
      if (i.status === "paid") return false;
      try { const d = parseISO(i.dueDate); return isValid(d) && d < new Date(); }
      catch { return false; }
    });
  } else {
    list = list.filter(i => i.status === statusFilter);
  }
}

    if (monthFilter !== "ALL")
    list = list.filter(i => i.installmentMonths.includes(monthFilter));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.studentName.toLowerCase().includes(q) ||
        i.invoiceNo.toLowerCase().includes(q)   ||
        i.grade.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [invoices, statusFilter, monthFilter, search, sortField, sortDir]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(field: keyof Invoice) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  function safeDate(str: string) {
    try { const d = parseISO(str); return isValid(d) ? format(d, "dd MMM yyyy") : str; }
    catch { return str; }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${filtered.length} invoices`}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="rounded-lg border p-2 hover:bg-accent transition-colors disabled:opacity-50" title="Refresh">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={load} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label}
            className={cn("rounded-xl border bg-card p-5 shadow-sm", s.border)}>
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              <div className={cn("rounded-lg p-2", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{loading ? "—" : s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 min-w-[200px]">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search student, invoice…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Month filter */}
        <select
          value={monthFilter}
          onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none cursor-pointer"
        >
          <option value="ALL">All Months</option>
          {MONTH_OPTIONS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5 ml-auto">
          {/* {(["ALL","paid","pending","partial","overdue"] as const).map(s => {
            const count = s === "ALL" ? invoices.length : invoices.filter(i => i.status === s).length; */}
            {(["ALL","paid","pending","partial","overdue"] as const).map(s => {
  const count = s === "ALL" 
    ? invoices.length 
    : s === "overdue"
      ? invoices.filter(i => {
          if (i.status === "paid") return false;
          try { const d = parseISO(i.dueDate); return isValid(d) && d < new Date(); }
          catch { return false; }
        }).length
      : invoices.filter(i => i.status === s).length;

            return (
              <button key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === s
                    ? "bg-foreground text-background border-foreground"
                    : "hover:bg-accent"
                )}>
                {s === "ALL" ? "All" : STATUS_CFG[s as Status].label} · {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">No invoices found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {[
                  { label: "Invoice #",  field: "invoiceNo"   as keyof Invoice },
                  { label: "Student",    field: "studentName" as keyof Invoice },
                  { label: "Amount",     field: "amountDue"   as keyof Invoice },
                  { label: "Status",     field: "status"      as keyof Invoice },
                  { label: "Due Date",   field: "dueDate"     as keyof Invoice },
                  { label: "Month",      field: null },
                  { label: "",           field: null },
                ].map(col => (
                  <th key={col.label}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {col.field ? (
                      <button
                        onClick={() => toggleSort(col.field!)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {col.label}
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortField === col.field ? "text-foreground" : "opacity-40"
                        )} />
                      </button>
                    ) : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(inv => {
                const pct = inv.amountDue > 0
                  ? Math.min(100, Math.round((inv.amountPaid / inv.amountDue) * 100))
                  : 0;
                const cfg = STATUS_CFG[inv.status] ?? STATUS_CFG.pending;
                const dueParsed = parseISO(inv.dueDate);
                const isOverdue = isValid(dueParsed) && dueParsed < new Date() && inv.status !== "paid";
                const month = inv.dueDate?.slice(0, 7)
                  ? (() => {
                      const [y, m] = inv.dueDate.split("-");
                      return `${MONTHS[parseInt(m) - 1]} ${y}`;
                    })()
                  : "—";

                return (
                  <tr key={inv.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors">

                    {/* Invoice # */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold">{inv.invoiceNo}</span>
                    </td>

                    {/* Student */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/students/${inv.studentId}`}
                        className="hover:text-primary transition-colors">
                        <p className="font-medium text-sm">{inv.studentName}</p>
                        {inv.grade && <p className="text-xs text-muted-foreground">{inv.grade}</p>}
                      </Link>
                    </td>

                    {/* Amount + progress */}
                    <td className="px-4 py-3 whitespace-nowrap min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">
                            ₹{inv.amountPaid.toLocaleString("en-IN")}
                          </span>
                          <span className="text-muted-foreground">
                            of ₹{inv.amountDue.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all",
                              pct === 100 ? "bg-emerald-500" : "bg-amber-500")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {inv.discount > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            Disc: ₹{inv.discount.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        cfg.cls
                      )}>
                        {cfg.label}
                      </span>
                    </td>

                    {/* Due date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn(
                        "text-xs",
                        isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
                      )}>
                        {safeDate(inv.dueDate)}
                      </span>
                    </td>

                    {/* Month badge */}
                    {/* <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground">{month}</span>
                    </td> */}
                    {/* Month badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">
                          {inv.installmentMonths.length > 0
                            ? inv.installmentMonths.map(m => {
                                const [y, mo] = m.split("-");
                                return `${MONTHS[parseInt(mo) - 1]} ${y}`;
                              }).join(", ")
                            : "—"}
                        </span>
                      </td>

                    {/* Action */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/fees/${inv.id}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors inline-flex">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filtered.length} invoices · page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-md border p-1.5 disabled:opacity-40 hover:bg-accent transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded-md border p-1.5 disabled:opacity-40 hover:bg-accent transition-colors">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
