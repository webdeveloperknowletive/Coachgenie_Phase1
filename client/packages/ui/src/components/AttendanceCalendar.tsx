"use client";
import * as React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from "date-fns";
import { cn } from "../lib/utils";

type AttendanceStatus = "present" | "absent" | "holiday" | "none";

interface AttendanceCalendarProps {
  month?: Date;
  attendance?: Record<string, AttendanceStatus>;
  onMonthChange?: (date: Date) => void;
}

const statusStyles: Record<AttendanceStatus, string> = {
  present: "bg-success-500 text-white",
  absent:  "bg-danger-500 text-white",
  holiday: "bg-warning-500 text-white",
  none:    "text-foreground hover:bg-muted",
};

export function AttendanceCalendar({ month = new Date(), attendance = {}, onMonthChange }: AttendanceCalendarProps) {
  const [current, setCurrent] = React.useState(month);
  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const startPad = getDay(startOfMonth(current));

  function navigate(dir: 1 | -1) {
    const next = new Date(current.getFullYear(), current.getMonth() + dir, 1);
    setCurrent(next);
    onMonthChange?.(next);
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-muted">←</button>
        <h3 className="font-semibold">{format(current, "MMMM yyyy")}</h3>
        <button onClick={() => navigate(1)} className="p-1 rounded hover:bg-muted">→</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const key    = format(day, "yyyy-MM-dd");
          const status = (attendance[key] ?? "none") as AttendanceStatus;
          return (
            <div
              key={key}
              title={status}
              className={cn(
                "aspect-square flex items-center justify-center rounded-full text-xs font-medium cursor-default",
                statusStyles[status],
                isToday(day) && status === "none" && "ring-2 ring-brand-500",
                !isSameMonth(day, current) && "opacity-30"
              )}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
        {(["present","absent","holiday"] as AttendanceStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={cn("h-2.5 w-2.5 rounded-full", statusStyles[s])} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}