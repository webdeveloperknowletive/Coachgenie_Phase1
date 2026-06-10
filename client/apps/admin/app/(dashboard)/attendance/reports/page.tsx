"use client";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types/academic";
import { useState, useEffect, useCallback } from "react";
import { format, subDays }                  from "date-fns";
import { RefreshCw }                        from "lucide-react";
import { toast }                            from "sonner";
import { api }                              from "@/lib/api";
import { AttendanceReport }                 from "@/components/attendance/AttendanceReport";
import { cn }                               from "@/lib/utils";
import { authHeaders }                      from "@/lib/auth-headers";

const API = "/api/proxy"

type AttendanceRecordApi = {
  studentId: string;
  batchId:   string;
  date:      string;
  status:    "present" | "absent" | "late";
};

function unwrap<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as any).data))
    return (value as any).data;
  return [];
}

export default function AttendanceReportsPage() {
  const [batches,    setBatches]    = useState<any[]>([]);
  const [students,   setStudents]   = useState<any[]>([]);
  const [batchId,    setBatchId]    = useState("");
  const [startDate,  setStartDate]  = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate,    setEndDate]    = useState(format(new Date(), "yyyy-MM-dd"));
  const [apiRecords, setApiRecords] = useState<AttendanceRecordApi[]>([]);
  const [loading,    setLoading]    = useState(false);

  // ✅ Fetch real batches from API
  useEffect(() => {
    fetch(`${API}/batches/`, { headers: authHeaders() })
      .then(r => r.json())
      .then(json => {
        const raw = Array.isArray(json) ? json : (json.data ?? []);
        setBatches(raw);
        if (raw.length > 0) setBatchId(String(raw[0].id));
      })
      .catch(() => toast.error("Failed to load batches"));
  }, []);

  // ✅ Fetch real students when batch changes
  useEffect(() => {
    if (!batchId) return;
    fetch(`${API}/batches/${batchId}/students`, { headers: authHeaders() })
      .then(r => r.json())
      .then(json => {
        const raw = Array.isArray(json) ? json : (json.data ?? []);
        setStudents(raw.map((s: any) => ({
          id:    String(s.id),
          name:  `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
          grade: s.current_class ?? "",
        })));
      })
      .catch(() => {});
  }, [batchId]);

  // ✅ Fetch attendance records
  const fetchRecords = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const response = await api.get<unknown>(
        `/attendance/?batch_id=${batchId}&from=${startDate}&to=${endDate}`
      );
      setApiRecords(unwrap<AttendanceRecordApi>(response));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [batchId, startDate, endDate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

const records: AttendanceRecord[] = apiRecords.map((r, index) => ({
  id: `${r.studentId}-${r.date}-${index}`,
  studentId: r.studentId,
  batchId: r.batchId,
  date: r.date,
  status: (
    r.status === "present"
      ? "PRESENT"
      : r.status === "absent"
      ? "ABSENT"
      : "LATE"
  ) as AttendanceStatus,
}));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Filter by batch and date range</p>
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
            {batches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">From</label>
          <input type="date" value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">To</label>
          <input type="date" value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <button onClick={fetchRecords} disabled={loading}
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
        records={records}
        startDate={new Date(startDate)}
        endDate={new Date(endDate)}
      />
      )}
    </div>
  );
}

