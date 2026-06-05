"use client";
import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useAcademicStore } from "@/lib/stores/academic.store";
import type { AttendanceStatus } from "@/lib/types/academic";

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-500 text-white",
  ABSENT:  "bg-red-400 text-white",
  LATE:    "bg-amber-400 text-white",
  HOLIDAY: "bg-slate-300 text-slate-700",
};

export default function StudentAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params);
  const store     = useAcademicStore();
  const student   = store.students.find(s => s.id === id);
  const [month, setMonth] = useState(new Date());

  const records   = store.attendance.filter(a => a.studentId === id);
  const recordMap = Object.fromEntries(records.map(r => [r.date, r.status]));

  const days      = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const padStart  = getDay(startOfMonth(month));

  const present   = records.filter(r => {
    const d = new Date(r.date);
    return r.status === "PRESENT" && isSameMonth(d, month);
  }).length;
  const absent    = records.filter(r => {
    const d = new Date(r.date);
    return r.status === "ABSENT" && isSameMonth(d, month);
  }).length;
  const total     = present + absent;
  const pct       = total > 0 ? Math.round((present/total)*100) : 0;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/students/${id}`} className="rounded-lg p-2 hover:bg-accent text-muted-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{student?.name} — Attendance</h1>
          <p className="text-sm text-muted-foreground">{student?.grade}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Present", value: present, color: "text-emerald-600" },
          { label: "Absent",  value: absent,  color: "text-red-500" },
          { label: "Rate",    value: `${pct}%`, color: pct >= 75 ? "text-emerald-600" : "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 text-center">
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))}
            className="rounded-lg p-1.5 hover:bg-accent transition-colors">←</button>
          <h3 className="font-semibold">{format(month, "MMMM yyyy")}</h3>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))}
            className="rounded-lg p-1.5 hover:bg-accent transition-colors">→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
            <div key={d} className="text-[11px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: padStart }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map(day => {
            const key    = format(day, "yyyy-MM-dd");
            const status = recordMap[key] as AttendanceStatus | undefined;
            return (
              <div key={key} title={status ?? "No record"}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-full text-xs font-medium cursor-default",
                  status ? STATUS_STYLE[status] : "text-muted-foreground hover:bg-muted"
                )}>
                {format(day, "d")}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 justify-center text-xs text-muted-foreground">
          {(["PRESENT","ABSENT","LATE","HOLIDAY"] as AttendanceStatus[]).map(s => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_STYLE[s])} />
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}