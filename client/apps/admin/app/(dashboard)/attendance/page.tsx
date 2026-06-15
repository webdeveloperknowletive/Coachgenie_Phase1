"use client";

import { useState, useEffect } from "react";
import { useSearchParams }      from "next/navigation";
import { format }               from "date-fns";
import { Save, CheckCircle, FileText }    from "lucide-react";
import { toast }                from "sonner";
import { api }                  from "@/lib/api";
import { useAcademicStore }     from "@/lib/stores/academic.store";
import { AttendanceGrid }       from "@/components/attendance/AttendanceGrid";
import { useAttendanceSession } from "@/hooks/useAttendanceSession";
import { authHeaders } from "@/lib/auth-headers";

// ─── Types ────────────────────────────────────────────────────────────────────

// type AttendanceStatus = "present" | "absent" | "late";
type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

// type AttendancePayload = {
//   studentId: string;
//   batchId:   string;
//   date:      string;
//   status:    AttendanceStatus;
// };

// ─── Inner session component ──────────────────────────────────────────────────

// function AttendanceSession({
//         batchId,
//         date,
//       }: {
//         batchId: string;
//         date:    string;
//       }) {
//         const store    = useAcademicStore();
//         const batch    = store.batches.find((b) => b.id === batchId);
//         const students = store.students.filter((s) => batch?.studentIds.includes(s.id));

//         const { entries, mark, markAll, save, saved, saving } = useAttendanceSession(
//           students.map((s) => s.id),
//         );
// function AttendanceSession({ batchId, date }: { batchId: string; date: string }) {
//   const store = useAcademicStore();
//   const batch = store.batches.find((b) => b.id === batchId);

//   // ✅ Fetch students directly from API instead of relying on store
//   const [students, setStudents] = useState<any[]>([]);
//   const [loadingStudents, setLoadingStudents] = useState(true);

//   useEffect(() => {
//     setLoadingStudents(true);
//     fetch(
//       `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/batches/${batchId}/students`,
//       { headers: authHeaders() }   // reuse your existing authHeaders()
//     )
//       .then((r) => r.json())
//       .then((json) => {
//         const raw: any[] = Array.isArray(json) ? json : (json.data ?? []);
//         setStudents(raw.map((s: any) => ({
//           id:    String(s.id),
//           name:  `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
//           grade: s.current_class ?? "",
//         })));
//       })
//       .catch(() => {})
//       .finally(() => setLoadingStudents(false));
//   }, [batchId]);

//   const { entries, mark, markAll, save, saved, saving } = useAttendanceSession(
//     students.map((s) => s.id),
//   );

//   // ... rest of component unchanged

//   if (loadingStudents) return <p className="text-sm text-muted-foreground">Loading students…</p>;
//   if (students.length === 0) return <p className="text-sm text-muted-foreground">No students found for this batch.</p>;



// async function handleSave() {
//   await save(async (data) => {
//     await api.post("/attendance/", {
//       class_id:     batchId,
//       session_date: date,
//       records: data.map((e) => ({
//         student_id: e.studentId,
//         status:     e.status.toLowerCase(),
//         remarks:    e.note ?? null,
//       })),
//     });

//     store.markAttendance(
//       data.map((e) => ({
//         studentId: e.studentId,
//         batchId,
//         date,
//         status: e.status as AttendanceStatus,
//       }))
//     );
//   });

//   toast.success("Attendance saved successfully!");
// }

  // if (students.length === 0) {
  //   return (
  //     <p className="text-sm text-muted-foreground">
  //       No students found for this batch.
  //     </p>
  //   );
  // }

  const API = "/api/proxy"

// function AttendanceSession({ batchId, date }: { batchId: string; date: string }) {
//   const store = useAcademicStore();
//   const batch = store.batches.find((b) => b.id === batchId);

//   const [students, setStudents] = useState<any[]>([]);
//   const [loadingStudents, setLoadingStudents] = useState(true);

//   useEffect(() => {
//     setLoadingStudents(true);
//     fetch(`${API}/batches/${batchId}/students`, { headers: authHeaders() })
//       .then((r) => r.json())
//       .then((json) => {
//         const raw: any[] = Array.isArray(json) ? json : (json.data ?? []);
//         setStudents(raw.map((s: any) => ({
//           id:    String(s.id),
//           name:  `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
//           grade: s.current_class ?? "",
//         })));
//       })
//       .catch(() => {})
//       .finally(() => setLoadingStudents(false));
//   }, [batchId]);
function AttendanceSession({ batchId, date }: { batchId: string; date: string }) {
  const store = useAcademicStore();
  const batch = store.batches.find((b) => b.id === batchId);

  const [students, setStudents]         = useState<any[]>([]);
  const [classes, setClasses]           = useState<any[]>([]);      // ← NEW
  const [selectedClassId, setSelectedClassId] = useState<string>(""); // ← NEW
  
  const [loadingStudents, setLoadingStudents] = useState(true);

  const API = "/api/proxy"

  useEffect(() => {
    setLoadingStudents(true);

    Promise.all([
      // fetch students
      fetch(`${API}/batches/${batchId}/students`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => (Array.isArray(json) ? json : (json.data ?? []))),

      // fetch classes for this batch
      fetch(`${API}/batches/${batchId}/classes`, { headers: authHeaders() })
        .then(r => r.json())
        .then(json => (Array.isArray(json) ? json : (json.data ?? []))),
    ])
      .then(([rawStudents, rawClasses]) => {
        setStudents(rawStudents.map((s: any) => ({
          id:    String(s.id),
          name:  `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
          grade: s.current_class ?? "",
        })));
        setClasses(rawClasses);
        // auto-select first class if available
        if (rawClasses.length > 0) setSelectedClassId(String(rawClasses[0].id));
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [batchId]);


  const { entries, mark, markAll, save, saved, saving } = useAttendanceSession(
    students.map((s) => s.id),
  );

  // async function handleSave() {

  //    if (!selectedClassId) {
  //   toast.error("Please select a class first");
  //   return;
  // }

  // if (students.length === 0) {
  //   toast.error("No students to save attendance for");
  //   return;
  // }


  //   await save(async (data) => {
  //     await api.post("/attendance/", {
  //       // class_id:     batchId,
  //       class_id:     selectedClassId,
  //       session_date: date,
  //       records: data.map((e) => ({
  //         student_id: e.studentId,
  //         status:     e.status.toLowerCase(),
  //         remarks:    e.note ?? null,
  //       })),
  //     });

  //     store.markAttendance(
  //       data.map((e) => ({
  //         studentId: e.studentId,
  //         batchId,
  //         date,
  //         status: e.status as AttendanceStatus,
  //       }))
  //     );
  //   });
  //   toast.success("Attendance saved successfully!");
  // }
  async function handleSave() {
  if (!selectedClassId) {
    toast.error("Please select a class first");
    return;
  }

  try {
    await save(async (data) => {
      await api.post("/attendance/", {
        class_id:     selectedClassId,
        session_date: date,
        records: data.map((e) => ({
          student_id: e.studentId,
          status:     e.status.toLowerCase(),
          remarks:    e.note ?? null,
        })),
      });

      store.markAttendance(
        data.map((e) => ({
          studentId: e.studentId,
          batchId,
          date,
          status: e.status as AttendanceStatus,
        }))
      );
    });
    toast.success("Attendance saved successfully!");
    
  } catch (err: any) {
    // ✅ Friendly message for duplicate attendance
    if (err.message?.includes("already taken")) {
      toast.error("Attendance already marked for this class today. Pick a different class or date.");
    } else {
      toast.error(err.message ?? "Failed to save attendance");
    }
  }
}

  if (loadingStudents) return (
    <p className="text-sm text-muted-foreground">Loading students…</p>
  );

  if (students.length === 0) return (
    <p className="text-sm text-muted-foreground">No students found for this batch.</p>
  );


  return (
    <div className="space-y-4">
      {/* Sub-header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{batch?.name}</p>
          <p className="text-sm text-muted-foreground">
            {students.length} students · {format(new Date(date), "dd MMM yyyy")}
          </p>
        </div>

         {/* ✅ ADD CLASS SELECTOR HERE */}
      {classes.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Select Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[250px]"
          >
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.title} — {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString() : ""}
              </option>
            ))}
          </select>
        </div>
      )}

        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" /> Saved!
            </>
          ) : saving ? (
            "Saving…"
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Attendance
            </>
          )}
        </button>

          {saved && (
  <button
    onClick={() => setSelectedClassId("")}  // forces re-select
    className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
  >
    Mark Another Class
  </button>
)}

      </div>

      <AttendanceGrid
        students={students}
        entries={entries}
        onMark={mark}
        onMarkAll={markAll}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const { batches }  = useAcademicStore();

  /**
   * FIX 3: Pre-fill batch and date from URL query params when the user
   * arrives from SessionsPage via:
   *   /attendance?batchId=xxx&date=yyyy-MM-dd
   * Falls back gracefully when params are absent (direct navigation).
   */
  const paramBatchId = searchParams.get("batchId") ?? "";
  const paramDate    = searchParams.get("date")    ?? format(new Date(), "yyyy-MM-dd");

  const defaultBatch =
    batches.find((b) => b.id === paramBatchId)?.id ?? batches[0]?.id ?? "";

  const [selectedBatch, setSelectedBatch] = useState(defaultBatch);
  const [date, setDate]                   = useState(paramDate);

  /**
   * FIX 4: If query params arrive after hydration (e.g. client-side nav),
   * sync them into state.
   */
  useEffect(() => {
    if (paramBatchId) setSelectedBatch(paramBatchId);
    if (paramDate)    setDate(paramDate);
  }, [paramBatchId, paramDate]);

  /**
   * FIX 5: Auto-start the session when query params are present so the
   * teacher lands directly on the grid — no extra "Start Session" click needed.
   */
  const [started, setStarted] = useState(Boolean(paramBatchId));

  function handleBatchChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedBatch(e.target.value);
    setStarted(false);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDate(e.target.value);
    setStarted(false);
  }

  // ──────────────────────────────────────────────────────────────
  // REPORT GENERATION FUNCTION
  // ──────────────────────────────────────────────────────────────

  async function handleGenerateAttendanceReport() {

    if (!selectedBatch) {

      toast.error("Please select a batch first");

      return;
    }

    try {

      toast.loading(
        "Generating attendance report...",
        {
          id: "attendance-report",
        }
      );

      const response = await fetch(
        "https://coachgenie-backend-rgx1.onrender.com/reports/attendance-report",
        {
          method: "POST",

          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            attendance_data: {
              batch_id: selectedBatch,
              date,
            },
          }),
        }
      );

      if (!response.ok) {

        let errorMessage =
          "Failed to generate attendance report";

        try {

          const err = await response.json();

          errorMessage =
            err.detail ||
            err.message ||
            errorMessage;

        } catch {}

        throw new Error(errorMessage);
      }

      // ✅ GET PDF BLOB
      const blob = await response.blob();

      // ✅ CREATE TEMP URL
      const url =
        window.URL.createObjectURL(blob);

      // ✅ CREATE DOWNLOAD LINK
      const a =
        document.createElement("a");

      a.href = url;

      a.download =
        `attendance_report_${Date.now()}.pdf`;

      document.body.appendChild(a);

      a.click();

      a.remove();

      // ✅ CLEANUP
      window.URL.revokeObjectURL(url);

      toast.success(
        "Attendance report downloaded!",
        {
          id: "attendance-report",
        }
      );

    } catch (err: any) {

      toast.error(
        err.message ??
        "Failed to generate attendance report",
        {
          id: "attendance-report",
        }
      );
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select a batch and date to begin
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Batch</label>
          <select
            value={selectedBatch}
            onChange={handleBatchChange}
            className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[200px]"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAttendanceReport}
            disabled={!selectedBatch}
            className="flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Attendance Report
          </button>

          <button
            onClick={() => setStarted(true)}
            className="h-10 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Session
          </button>
        </div>
      </div>

      {/* Session grid */}
      {started && selectedBatch && (
        <div className="rounded-xl border bg-card p-5">
          {/*
           * FIX 6: key forces a full remount whenever batch or date changes,
           * preventing stale attendance entries from a previous selection
           * bleeding into the new session.
           */}
          <AttendanceSession
            key={`${selectedBatch}-${date}`}
            batchId={selectedBatch}
            date={date}
          />
        </div>
      )}
    </div>
  );
}

