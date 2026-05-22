// "use client";
// import { useState } from "react";
// import { format } from "date-fns";
// import { Save, CheckCircle } from "lucide-react";
// import { toast } from "sonner";
// import { useAcademicStore }    from "@/lib/stores/academic.store";
// import { AttendanceGrid }      from "@/components/attendance/AttendanceGrid";
// import { useAttendanceSession } from "@/hooks/useAttendanceSession";

// function AttendanceSession({ batchId, date }: { batchId: string; date: string }) {
//   const store   = useAcademicStore();
//   const batch   = store.batches.find(b => b.id === batchId);
//   const students = store.students.filter(s => batch?.studentIds.includes(s.id));

//   const { entries, mark, markAll, save, saved, saving } = useAttendanceSession(
//     students.map(s => s.id)
//   );

//   async function handleSave() {
//     await save(async (data) => {
//       store.markAttendance(data.map(e => ({
//         studentId: e.studentId,
//         batchId,
//         date,
//         status: e.status,
//       })));
//       await new Promise(r => setTimeout(r, 400));
//     });
//     toast.success("Attendance saved successfully!");
//   }

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="font-semibold">{batch?.name}</p>
//           <p className="text-sm text-muted-foreground">{students.length} students · {format(new Date(date), "dd MMM yyyy")}</p>
//         </div>
//         <button onClick={handleSave} disabled={saving || saved}
//           className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
//           {saved
//             ? <><CheckCircle className="h-4 w-4" /> Saved!</>
//             : saving
//               ? "Saving…"
//               : <><Save className="h-4 w-4" /> Save Attendance</>
//           }
//         </button>
//       </div>
//       <AttendanceGrid students={students} entries={entries} onMark={mark} onMarkAll={markAll} />
//     </div>
//   );
// }

// export default function AttendancePage() {
//   const { batches } = useAcademicStore();
//   // const activeBatches = batches.filter(b => b.status === "ACTIVE");
//   const activeBatches = batches;
//   const [selectedBatch, setSelectedBatch] = useState(activeBatches[0]?.id ?? "");
//   const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
//   const [started, setStarted] = useState(false);

//   return (
//     <div className="space-y-5">
//       <div>
//         <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
//         <p className="text-sm text-muted-foreground mt-0.5">Select a batch and date to begin</p>
//       </div>

//       <div className="flex flex-wrap gap-3 items-end">
//         <div className="space-y-1.5">
//           <label className="text-sm font-medium">Batch</label>
//           <select value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setStarted(false); }}
//             className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[200px]">
//             {activeBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
//           </select>
//         </div>
//         <div className="space-y-1.5">
//           <label className="text-sm font-medium">Date</label>
//           <input type="date" value={date}
//             onChange={e => { setDate(e.target.value); setStarted(false); }}
//             className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
//         </div>
//         <button onClick={() => setStarted(true)}
//           className="h-10 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
//           Start Session
//         </button>
//       </div>

//       {started && selectedBatch && (
//         <div className="rounded-xl border bg-card p-5">
//           <AttendanceSession batchId={selectedBatch} date={date} />
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useSearchParams }      from "next/navigation";
import { format }               from "date-fns";
import { Save, CheckCircle }    from "lucide-react";
import { toast }                from "sonner";
import { api }                  from "@/lib/api";
import { useAcademicStore }     from "@/lib/stores/academic.store";
import { AttendanceGrid }       from "@/components/attendance/AttendanceGrid";
import { useAttendanceSession } from "@/hooks/useAttendanceSession";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = "present" | "absent" | "late";

type AttendancePayload = {
  studentId: string;
  batchId:   string;
  date:      string;
  status:    AttendanceStatus;
};

// ─── Inner session component ──────────────────────────────────────────────────

function AttendanceSession({
  batchId,
  date,
}: {
  batchId: string;
  date:    string;
}) {
  const store    = useAcademicStore();
  const batch    = store.batches.find((b) => b.id === batchId);
  const students = store.students.filter((s) => batch?.studentIds.includes(s.id));

  const { entries, mark, markAll, save, saved, saving } = useAttendanceSession(
    students.map((s) => s.id),
  );

  async function handleSave() {
    await save(async (data) => {
      const payload: AttendancePayload[] = data.map((e) => ({
        studentId: e.studentId,
        batchId,
        date,
        status: e.status as AttendanceStatus,
      }));

      // FIX 1: Persist to the real backend API
      await api.post("/attendance/", { records: payload });

      // FIX 2: Also update local Zustand store so Reports page reflects it
      //         without needing a page reload
      store.markAttendance(payload);
    });

    toast.success("Attendance saved successfully!");
  }

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No students found for this batch.
      </p>
    );
  }

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

        <button
          onClick={() => setStarted(true)}
          className="h-10 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Start Session
        </button>
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