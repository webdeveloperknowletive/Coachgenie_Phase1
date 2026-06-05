// "use client";

// import { useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import { CalendarDays, CheckCircle2, CheckSquare, Clock, ClipboardList, Plus, RefreshCw, Users } from "lucide-react";
// import { toast } from "sonner";
// import { api } from "@/lib/api";
// import { cn } from "@/lib/utils";

// type BatchApi = {
//   id: string;
//   name: string;
//   target_exam?: string | null;
//   code?: string | null;
// };

// type ClassApi = {
//   id: string;
//   title: string;
//   scheduled_at: string;
//   duration_min: number;
//   status: string;
//   room_or_link?: string | null;
// };

// type Session = ClassApi & {
//   batchId: string;
//   batchName: string;
//   subject: string;
// };

// function unwrap<T>(value: unknown): T[] {
//   if (Array.isArray(value)) return value as T[];
//   if (value && typeof value === "object" && Array.isArray((value as any).data)) {
//     return (value as any).data as T[];
//   }
//   return [];
// }

// function formatWhen(value: string) {
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value || "Not scheduled";
//   return date.toLocaleString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function normalizeStatus(status: string) {
//   const normalized = status.toLowerCase();
//   if (normalized.includes("complete")) return "Completed";
//   if (normalized.includes("cancel")) return "Cancelled";
//   return "Upcoming";
// }

// export default function SessionsPage() {
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   async function fetchSessions() {
//     setLoading(true);
//     setError(null);
//     try {
//       const batchResponse = await api.get<unknown>("/batches/");
//       const batches = unwrap<BatchApi>(batchResponse);
//       const sessionGroups = await Promise.all(
//         batches.map(async (batch) => {
//           const response = await api.get<unknown>(`/batches/${batch.id}/classes`);
//           return unwrap<ClassApi>(response).map((session) => ({
//             ...session,
//             batchId: String(batch.id),
//             batchName: batch.name,
//             subject: batch.target_exam ?? batch.code ?? "General",
//           }));
//         })
//       );
//       setSessions(sessionGroups.flat().sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
//     } catch (err) {
//       const message = err instanceof Error ? err.message : "Failed to load sessions";
//       setError(message);
//       toast.error(message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function markCompleted(sessionId: string) {
//     try {
//       await api.patch(`/batches/classes/${sessionId}`, { status: "completed" });
//       setSessions((items) => items.map((item) => item.id === sessionId ? { ...item, status: "completed" } : item));
//       toast.success("Session marked as completed");
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Unable to update session");
//     }
//   }

//   useEffect(() => {
//     fetchSessions();
//   }, []);

//   const stats = useMemo(() => {
//     const today = new Date().toDateString();
//     const todayCount = sessions.filter((item) => new Date(item.scheduled_at).toDateString() === today).length;
//     const pendingAttendance = sessions.filter((item) => normalizeStatus(item.status) !== "Completed").length;
//     return [
//       { label: "Today", value: String(todayCount), icon: CalendarDays },
//       { label: "Total sessions", value: String(sessions.length), icon: Users },
//       { label: "Pending attendance", value: String(pendingAttendance), icon: CheckSquare },
//       { label: "Completed", value: String(sessions.length - pendingAttendance), icon: ClipboardList },
//     ];
//   }, [sessions]);

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
//           <p className="mt-1 text-sm text-muted-foreground">
//             Plan classes, track completion, and jump into attendance for each backend class session.
//           </p>
//         </div>
//         <div className="flex gap-2">
//           <button onClick={fetchSessions} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60">
//             <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
//           </button>
//           <Link href="/batches" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
//             <Plus className="h-4 w-4" /> Schedule via Batch
//           </Link>
//         </div>
//       </div>

//       <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//         {stats.map(({ label, value, icon: Icon }) => (
//           <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
//             <div className="flex items-center justify-between">
//               <p className="text-sm text-muted-foreground">{label}</p>
//               <Icon className="h-4 w-4 text-primary" />
//             </div>
//             <p className="mt-3 text-2xl font-bold">{value}</p>
//           </div>
//         ))}
//       </div>

//       <div className="rounded-xl border bg-card shadow-sm">
//         <div className="border-b px-5 py-4">
//           <h2 className="font-semibold">Session Schedule</h2>
//           <p className="text-sm text-muted-foreground">Loaded from batch class APIs.</p>
//         </div>

//         {loading && <div className="p-5 text-sm text-muted-foreground">Loading sessions...</div>}
//         {!loading && error && <div className="p-5 text-sm text-destructive">{error}</div>}
//         {!loading && !error && sessions.length === 0 && (
//           <div className="p-8 text-center text-sm text-muted-foreground">
//             No sessions found. Create classes from a batch to populate this schedule.
//           </div>
//         )}

//         {!loading && !error && sessions.length > 0 && (
//           <div className="divide-y">
//             {sessions.map((session) => {
//               const status = normalizeStatus(session.status);
//               return (
//                 <div key={session.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
//                   <div className="min-w-0">
//                     <div className="flex flex-wrap items-center gap-2">
//                       <p className="font-medium">{session.title}</p>
//                       <span className={cn(
//                         "rounded-full border px-2.5 py-0.5 text-xs",
//                         status === "Completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "text-muted-foreground"
//                       )}>
//                         {status}
//                       </span>
//                     </div>
//                     <p className="mt-1 text-sm text-muted-foreground">
//                       {session.batchName} · {session.subject} · {session.room_or_link ?? "Room not set"} · {session.duration_min} min
//                     </p>
//                   </div>
//                   <div className="flex flex-wrap items-center gap-2">
//                     <span className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground">
//                       <Clock className="h-3.5 w-3.5" /> {formatWhen(session.scheduled_at)}
//                     </span>
//                     {status !== "Completed" && (
//                       <button onClick={() => markCompleted(session.id)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent">
//                         <CheckCircle2 className="h-3.5 w-3.5" /> Complete
//                       </button>
//                     )}
//                     <Link href="/attendance" className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent">
//                       Mark Attendance
//                     </Link>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays, CheckCircle2, CheckSquare,
  Clock, ClipboardList, Plus, RefreshCw, Users,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── API Types ───────────────────────────────────────────────────────────────

type BatchApi = {
  id: string;
  name: string;
  target_exam?: string | null;
  code?: string | null;
};

type ClassApi = {
  id: string;
  title: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
  room_or_link?: string | null;
};

type Session = ClassApi & {
  batchId: string;
  batchName: string;
  subject: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function unwrap<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Not scheduled";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status: string): "Completed" | "Cancelled" | "Upcoming" {
  const s = status.toLowerCase();
  if (s.includes("complete")) return "Completed";
  if (s.includes("cancel")) return "Cancelled";
  return "Upcoming";
}

/**
 * Derives the attendance date from scheduled_at.
 * Falls back to today if the value is invalid.
 */
function sessionDate(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  return Number.isNaN(d.getTime())
    ? format(new Date(), "yyyy-MM-dd")
    : format(d, "yyyy-MM-dd");
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchSessions() {
    setLoading(true);
    setError(null);
    try {
      const batchResponse = await api.get<unknown>("/batches/");
      const batches       = unwrap<BatchApi>(batchResponse);

      const sessionGroups = await Promise.all(
        batches.map(async (batch) => {
          const response = await api.get<unknown>(`/batches/${batch.id}/classes`);
          return unwrap<ClassApi>(response).map<Session>((session) => ({
            ...session,
            batchId:   String(batch.id),
            batchName: batch.name,
            subject:   batch.target_exam ?? batch.code ?? "General",
          }));
        }),
      );

      setSessions(
        sessionGroups
          .flat()
          .sort(
            (a, b) =>
              new Date(a.scheduled_at).getTime() -
              new Date(b.scheduled_at).getTime(),
          ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load sessions";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // ── Mark complete ──────────────────────────────────────────────────────────

  async function markCompleted(sessionId: string) {
    try {
      await api.patch(`/batches/classes/${sessionId}`, { status: "completed" });
      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionId ? { ...item, status: "completed" } : item,
        ),
      );
      toast.success("Session marked as completed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update session");
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const today          = new Date().toDateString();
    const todayCount     = sessions.filter(
      (s) => new Date(s.scheduled_at).toDateString() === today,
    ).length;
    const completed      = sessions.filter(
      (s) => normalizeStatus(s.status) === "Completed",
    ).length;
    const pending        = sessions.length - completed;

    return [
      { label: "Today",              value: String(todayCount), icon: CalendarDays  },
      { label: "Total sessions",     value: String(sessions.length), icon: Users    },
      { label: "Pending attendance", value: String(pending),    icon: CheckSquare   },
      { label: "Completed",          value: String(completed),  icon: ClipboardList },
    ];
  }, [sessions]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan classes, track completion, and jump into attendance for each session.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <Link
            href="/batches"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Schedule via Batch
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Session Schedule</h2>
          <p className="text-sm text-muted-foreground">Loaded from batch class APIs.</p>
        </div>

        {loading && (
          <div className="p-5 text-sm text-muted-foreground">Loading sessions…</div>
        )}
        {!loading && error && (
          <div className="p-5 text-sm text-destructive">{error}</div>
        )}
        {!loading && !error && sessions.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No sessions found. Create classes from a batch to populate this schedule.
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="divide-y">
            {sessions.map((session) => {
              const status = normalizeStatus(session.status);

              /**
               * FIX: Pass batchId and date as query params so AttendancePage
               * can pre-select the correct batch and date automatically.
               */
              const attendanceHref = `/attendance?batchId=${session.batchId}&date=${sessionDate(session.scheduled_at)}`;

              return (
                <div
                  key={session.id}
                  className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{session.title}</p>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs",
                          status === "Completed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : status === "Cancelled"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "text-muted-foreground",
                        )}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {session.batchName} · {session.subject} ·{" "}
                      {session.room_or_link ?? "Room not set"} · {session.duration_min} min
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatWhen(session.scheduled_at)}
                    </span>

                    {status !== "Completed" && (
                      <button
                        onClick={() => markCompleted(session.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                      </button>
                    )}

                    {/* FIX: Link now carries batchId + date so AttendancePage auto-fills */}
                    <Link
                      href={attendanceHref}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      Mark Attendance
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}