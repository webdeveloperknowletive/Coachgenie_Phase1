"use client";
import { useEffect, useState } from "react";
import {
  MessageSquare, Mail, Phone,
  CheckCircle, XCircle, Clock,
  Send, RefreshCw, Filter, Search,
} from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

type Channel = "sms" | "whatsapp" | "email";
type Status  = "queued" | "sent" | "failed";
type Role    = "student" | "parent" | "tutor" | "admin";

interface NotifLog {
  id:             string;
  channel:        Channel;
  recipient_ref:  string;
  recipient_name: string | null;  // populated by backend join
  recipient_role: Role   | null;
  subject:        string | null;
  body:           string;
  status:         Status;
  trigger_source: string | null;  // e.g. "fee_overdue", "manual", "low_attendance"
  sent_at:        string | null;
  created_at:     string;
}

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  sms:      { label: "SMS",      icon: Phone,         color: "text-blue-600"    },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "text-emerald-600" },
  email:    { label: "Email",    icon: Mail,          color: "text-violet-600"  },
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  sent:   { label: "Sent",    className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  failed: { label: "Failed",  className: "bg-red-50 text-red-600 border-red-200",             icon: XCircle    },
  queued: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200",       icon: Clock      },
};

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  student: { label: "Student", color: "#0C447C", bg: "#E6F1FB" },
  parent:  { label: "Parent",  color: "#085041", bg: "#E1F5EE" },
  tutor:   { label: "Tutor",   color: "#633806", bg: "#FAEEDA" },
  admin:   { label: "Admin",   color: "#791F1F", bg: "#FCEBEB" },
};

const TRIGGER_LABELS: Record<string, string> = {
  manual:          "Manual send",
  fee_overdue:     "Fee overdue",
  fee_due:         "Fee due reminder",
  payment_received:"Payment received",
  absent:          "Absent alert",
  low_attendance:  "Low attendance",
  exam_scheduled:  "Exam scheduled",
  results_published:"Results published",
  session_cancelled:"Session cancelled",
  admission_approved:"Admission approved",
};

// function formatDate(dateStr: string): string {
//   const d = parseISO(dateStr);
//   if (isToday(d))     return `Today, ${format(d, "hh:mm a")}`;
//   if (isYesterday(d)) return `Yesterday, ${format(d, "hh:mm a")}`;
//   return format(d, "dd MMM, hh:mm a");
// }
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = parseISO(dateStr);
    if (isToday(d))     return `Today, ${format(d, "hh:mm a")}`;
    if (isYesterday(d)) return `Yesterday, ${format(d, "hh:mm a")}`;
    return format(d, "dd MMM, hh:mm a");
  } catch {
    return "—";
  }
}

export default function NotificationsPage() {
  const [logs,      setLogs]      = useState<NotifLog[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [retrying,  setRetrying]  = useState<string | null>(null);
  const [channel,   setChannel]   = useState("all");
  const [role,      setRole]      = useState("all");
  const [status,    setStatus]    = useState("all");
  const [search,    setSearch]    = useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [showFilters, setShowFilters] = useState(false);

  function fetchLogs() {
    setLoading(true);
    return api.get("/notifications/logs")
      .then(res => setLogs(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchLogs(); }, []);

  async function retryNotification(id: string) {
    setRetrying(id);
    try {
      await api.post(`/notifications/logs/${id}/retry`);
      toast.success("Notification resent!");
      await fetchLogs();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Retry failed");
    } finally {
      setRetrying(null);
    }
  }

  const filtered = logs.filter(n => {
    if (channel !== "all" && n.channel !== channel)              return false;
    if (role    !== "all" && n.recipient_role !== role)          return false;
    if (status  !== "all" && n.status !== status)                return false;
    if (search && !(
      (n.recipient_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      n.recipient_ref.includes(search) ||
      (n.subject ?? "").toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase())
    )) return false;
    if (dateFrom && n.created_at < dateFrom) return false;
    if (dateTo   && n.created_at > dateTo + "T23:59:59") return false;
    return true;
  });

  // Summary counts
  const sentCount   = logs.filter(n => n.status === "sent").length;
  const failedCount = logs.filter(n => n.status === "failed").length;
  const pendingCount= logs.filter(n => n.status === "queued").length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{logs.length} notifications total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} title="Refresh"
            className="rounded-lg border p-2 text-muted-foreground hover:bg-accent transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link href="/notifications/send"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Send className="h-4 w-4" /> Send Notification
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-xl font-semibold text-emerald-600">{sentCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sent</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-xl font-semibold text-red-600">{failedCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Failed</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-xl font-semibold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {["all", "sms", "whatsapp", "email"].map(c => (
            <button key={c} onClick={() => setChannel(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                channel === c ? "bg-foreground text-background" : "hover:bg-accent"
              )}>
              {c.toUpperCase()} ({c === "all" ? logs.length : logs.filter(n => n.channel === c).length})
            </button>
          ))}
        </div>
        <button onClick={() => setShowFilters(f => !f)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            showFilters ? "bg-foreground text-background" : "hover:bg-accent"
          )}>
          <Filter className="h-3 w-3" /> Filters
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="rounded-xl border bg-card p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Role filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="all">All roles</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="tutor">Tutor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {/* Status filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="all">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="queued">Pending</option>
            </select>
          </div>
          {/* Date from */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          {/* Date to */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, email or message…"
          className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-40 rounded-xl border bg-card text-sm text-muted-foreground">
              No notifications found.
            </div>
          )}
          {filtered.map((n, i) => {
            const chanCfg   = CHANNEL_CONFIG[n.channel]   ?? CHANNEL_CONFIG["email"]!;
            const statusCfg = STATUS_CONFIG[n.status]     ?? STATUS_CONFIG["queued"]!;
            const StatusIcon = statusCfg.icon;
            const roleCfg   = n.recipient_role ? ROLE_CONFIG[n.recipient_role] : null;
            const triggerLabel = n.trigger_source ? (TRIGGER_LABELS[n.trigger_source] ?? n.trigger_source) : null;

            return (
              <div key={n.id} className="rounded-xl border bg-card p-4 fade-in"
                style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 rounded-lg p-2 bg-muted shrink-0">
                      <chanCfg.icon className={cn("h-4 w-4", chanCfg.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Recipient row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {n.recipient_name ?? n.recipient_ref}
                        </span>
                        {roleCfg && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: roleCfg.bg, color: roleCfg.color }}>
                            {roleCfg.label}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground font-mono">
                          {n.recipient_ref}
                        </span>
                        {n.subject && (
                          <span className="text-xs font-medium text-muted-foreground">· {n.subject}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.body}</p>
                      {/* Trigger source */}
                      {triggerLabel && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">Trigger:</span> {triggerLabel}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                      statusCfg.className
                    )}>
                      <StatusIcon className="h-2.5 w-2.5" /> {statusCfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {/* {n.sent_at ? formatDate(n.sent_at) : formatDate(n.created_at)} */}
                      {n.sent_at ? formatDate(n.sent_at) : formatDate(n.created_at)}
                    </span>
                    {/* Retry button for failed */}
                    {n.status === "failed" && (
                      <button onClick={() => retryNotification(n.id)}
                        disabled={retrying === n.id}
                        className="flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50">
                        <RefreshCw className={cn("h-3 w-3", retrying === n.id && "animate-spin")} />
                        {retrying === n.id ? "Retrying…" : "Retry"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}