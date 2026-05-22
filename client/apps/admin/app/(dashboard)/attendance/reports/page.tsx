// "use client";
// import { useState } from "react";
// import { format, subDays } from "date-fns";
// import { useAcademicStore }   from "@/lib/stores/academic.store";
// import { AttendanceReport }   from "@/components/attendance/AttendanceReport";

// export default function AttendanceReportsPage() {
//   const store      = useAcademicStore();
//   const [batchId, setBatchId]     = useState(store.batches[0]?.id ?? "");
//   const [startDate, setStartDate] = useState(format(subDays(new Date(),30),"yyyy-MM-dd"));
//   const [endDate, setEndDate]     = useState(format(new Date(),"yyyy-MM-dd"));

//   const batch    = store.batches.find(b => b.id === batchId);
//   const students = store.students.filter(s => batch?.studentIds.includes(s.id));

//   return (
//     <div className="space-y-5">
//       <div>
//         <h1 className="text-2xl font-bold tracking-tight">Attendance Reports</h1>
//         <p className="text-sm text-muted-foreground mt-0.5">Filter by batch and date range</p>
//       </div>

//       <div className="flex flex-wrap gap-3 items-end rounded-xl border bg-card p-5">
//         <div className="space-y-1.5">
//           <label className="text-sm font-medium">Batch</label>
//           <select value={batchId} onChange={e => setBatchId(e.target.value)}
//             className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[200px]">
//             {store.batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
//           </select>
//         </div>
//         <div className="space-y-1.5">
//           <label className="text-sm font-medium">From</label>
//           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
//             className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
//         </div>
//         <div className="space-y-1.5">
//           <label className="text-sm font-medium">To</label>
//           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
//             className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
//         </div>
//       </div>

//       <AttendanceReport
//         students={students}
//         records={store.attendance}
//         startDate={new Date(startDate)}
//         endDate={new Date(endDate)}
//       />
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays }                  from "date-fns";
import { RefreshCw }                        from "lucide-react";
import { toast }                            from "sonner";
import { api }                              from "@/lib/api";
import { useAcademicStore }                 from "@/lib/stores/academic.store";
import { AttendanceReport }                 from "@/components/attendance/AttendanceReport";
import { cn }                              from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Shape returned by GET /attendance/
 * Adjust field names to match your actual API contract.
 */
type AttendanceRecordApi = {
  id:         string;
  studentId:  string;
  batchId:    string;
  date:       string;           // "yyyy-MM-dd"
  status:     "present" | "absent" | "late";
};

function unwrap<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendanceReportsPage() {
  const store = useAcademicStore();

  const [batchId, setBatchId]     = useState(store.batches[0]?.id ?? "");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate]     = useState(format(new Date(), "yyyy-MM-dd"));

  /**
   * FIX 1: Keep a separate API-fetched records list so reports are accurate
   * even after a page refresh (Zustand store is wiped on reload).
   */
  const [apiRecords, setApiRecords] = useState<AttendanceRecordApi[]>([]);
  const [loading, setLoading]       = useState(false);

  const batch    = store.batches.find((b) => b.id === batchId);
  const students = store.students.filter((s) => batch?.studentIds.includes(s.id));

  /**
   * FIX 2: Fetch attendance from the real backend whenever the filters change.
   * Query params: batchId, from, to — adjust to your API's contract.
   */
  const fetchRecords = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const response = await api.get<unknown>(
        `/attendance/?batchId=${batchId}&from=${startDate}&to=${endDate}`,
      );
      setApiRecords(unwrap<AttendanceRecordApi>(response));

      /**
       * FIX 3: Sync fetched records back into Zustand so any in-session
       * components that read from the store stay consistent.
       */
      store.markAttendance(
        unwrap<AttendanceRecordApi>(response).map((r) => ({
          studentId: r.studentId,
          batchId:   r.batchId,
          date:      r.date,
          status:    r.status,
        })),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, [batchId, startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  /**
   * FIX 4: Merge API records with any locally-saved Zustand records so that
   * attendance marked in the current session also appears in the report
   * immediately (before the next API refetch).
   */
  const mergedRecords = [
    ...apiRecords,
    ...store.attendance.filter(
      (r) =>
        r.batchId === batchId &&
        r.date >= startDate &&
        r.date <= endDate &&
        !apiRecords.some(
          (ar) => ar.studentId === r.studentId && ar.date === r.date,
        ),
    ),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Filter by batch and date range
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border bg-card p-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Batch</label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[200px]"
          >
            {store.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* FIX 5: Manual refresh button */}
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Report */}
      {loading ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading attendance data…
        </div>
      ) : (
        <AttendanceReport
          students={students}
          records={mergedRecords}
          startDate={new Date(startDate)}
          endDate={new Date(endDate)}
        />
      )}
    </div>
  );
}