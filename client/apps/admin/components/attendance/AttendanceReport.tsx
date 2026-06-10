"use client";
import { useMemo } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import type { Student, AttendanceRecord } from "@/lib/types/academic";

interface AttendanceReportProps {
  students:   Student[];
  records:    AttendanceRecord[];
  startDate:  Date;
  endDate:    Date;
}

export function AttendanceReport({ students, records, startDate, endDate }: AttendanceReportProps) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const stats = useMemo(() => students.map(student => {
    const studentRecords = records.filter(r => {
      const d = new Date(r.date);
      return r.studentId === student.id && d >= startDate && d <= endDate;
    });
   const present = studentRecords.filter(r => r.status.toLowerCase() === "present").length;
const absent  = studentRecords.filter(r => r.status.toLowerCase() === "absent").length;
const late    = studentRecords.filter(r => r.status.toLowerCase() === "late").length;
    const total   = present + absent + late;
    const pct     = total > 0 ? Math.round((present/total)*100) : 0;
    return { student, present, absent, late, total, pct };
  }), [students, records, startDate, endDate]);

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Present</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Absent</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Late</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(({ student, present, absent, late, pct }) => (
            <tr key={student.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {student.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <span className="font-medium">{student.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center font-mono text-emerald-600 font-semibold">{present}</td>
              <td className="px-4 py-3 text-center font-mono text-red-500 font-semibold">{absent}</td>
              <td className="px-4 py-3 text-center font-mono text-amber-600 font-semibold">{late}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full",
                      pct>=75?"bg-emerald-500":pct>=50?"bg-amber-500":"bg-red-500"
                    )} style={{ width:`${pct}%` }} />
                  </div>
                  <span className={cn("text-xs font-semibold w-10 text-right",
                    pct>=75?"text-emerald-600":pct>=50?"text-amber-600":"text-red-500"
                  )}>{pct}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
