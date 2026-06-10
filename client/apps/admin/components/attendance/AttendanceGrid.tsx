"use client";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/types/academic";
import type { AttendanceStatus } from "@/lib/types/academic";

const STATUSES: AttendanceStatus[] = ["PRESENT","ABSENT","LATE","HOLIDAY"];

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-500 text-white border-emerald-500",
  ABSENT:  "bg-red-400 text-white border-red-400",
  LATE:    "bg-amber-400 text-white border-amber-400",
  HOLIDAY: "bg-slate-300 text-slate-700 border-slate-300",
};

interface AttendanceGridProps {
  students: Student[];
  entries:  Record<string, { studentId: string; status: AttendanceStatus }>;
  onMark:   (studentId: string, status: AttendanceStatus) => void;
  onMarkAll:(status: AttendanceStatus) => void;
}

export function AttendanceGrid({ students, entries, onMark, onMarkAll }: AttendanceGridProps) {
  const present = Object.values(entries).filter(e => e.status === "PRESENT").length;
  const absent  = Object.values(entries).filter(e => e.status === "ABSENT").length;
  const late    = Object.values(entries).filter(e => e.status === "LATE").length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
        {[
          { label:"Present", value:present, color:"text-emerald-600" },
          { label:"Absent",  value:absent,  color:"text-red-500" },
          { label:"Late",    value:late,    color:"text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={cn("text-2xl font-bold", color)}>{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex gap-1.5">
          <span className="text-xs text-muted-foreground self-center">Mark all:</span>
          {STATUSES.map(s => (
            <button key={s} onClick={() => onMarkAll(s)}
              className={cn("rounded-md border px-3 py-1 text-xs font-medium transition-colors", STATUS_STYLE[s])}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Student rows */}
      <div className="space-y-2">
        {students.map((student, i) => {
          const entry  = entries[student.id];
          const status = entry?.status ?? "PRESENT";
          return (
            <div key={student.id}
              className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 fade-in"
              style={{ animationDelay:`${i*30}ms` }}>
              <span className="text-xs text-muted-foreground w-6 shrink-0 font-mono">{i+1}</span>
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {student.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.grade}</p>
              </div>
              <div className="flex gap-1.5">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => onMark(student.id, s)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                      status === s ? STATUS_STYLE[s] : "hover:bg-muted text-muted-foreground"
                    )}>
                    {s === "PRESENT" ? "P" : s === "ABSENT" ? "A" : s === "LATE" ? "L" : "H"}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
