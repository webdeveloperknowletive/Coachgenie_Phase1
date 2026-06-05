"use client";
import { Users, CalendarDays, IndianRupee, TrendingUp } from "lucide-react";

const KPIS = [
  {
    title:    "Total Students",
    value:    "248",
    change:   "+12%",
    positive: true,
    sub:      "vs last month",
    icon:     Users,
    color:    "text-blue-500",
    bg:       "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    title:    "Sessions This Month",
    value:    "186",
    change:   "+8%",
    positive: true,
    sub:      "vs last month",
    icon:     CalendarDays,
    color:    "text-violet-500",
    bg:       "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    title:    "Fee Collected",
    value:    "₹4.8L",
    change:   "-3%",
    positive: false,
    sub:      "vs last month",
    icon:     IndianRupee,
    color:    "text-emerald-500",
    bg:       "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    title:    "Attendance Rate",
    value:    "87.4%",
    change:   "+2.1%",
    positive: true,
    sub:      "vs last month",
    icon:     TrendingUp,
    color:    "text-amber-500",
    bg:       "bg-amber-50 dark:bg-amber-950/40",
  },
];

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((kpi, i) => (
        <div
          key={kpi.title}
          className="rounded-xl border bg-card p-5 shadow-sm fade-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
            <div className={`rounded-lg p-2 ${kpi.bg}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight">{kpi.value}</p>
          <p className="mt-1 flex items-center gap-1 text-xs">
            <span className={kpi.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
              {kpi.change}
            </span>
            <span className="text-muted-foreground">{kpi.sub}</span>
          </p>
        </div>
      ))}
    </div>
  );
}