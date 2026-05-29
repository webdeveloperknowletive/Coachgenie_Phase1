

// "use client";
// import { useEffect, useState } from "react";
// import { Users, CalendarDays, IndianRupee, TrendingUp } from "lucide-react";
// import { api } from "@/lib/api";

// interface OwnerDashboard {
//   total_students: number;
//   active_batches: number;
//   total_leads: number;
//   converted_leads: number;
//   total_revenue: number;
//   pending_revenue: number;
//   total_exams: number;
//   avg_attendance_percent: number;
// }

// function formatCurrency(val: number) {
//   if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
//   if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
//   return `₹${val}`;
// }

// export function KpiCards() {
//   const [data, setData] = useState<OwnerDashboard | null>(null);
//   const [loading, setLoading] = useState(true);

//   // useEffect(() => {
//   //   api.get("/dashboard/owner")
//   //     .then((res) => setData(res.data.data))
//   //     .catch(console.error)
//   //     .finally(() => setLoading(false));
//   // }, []);
//   useEffect(() => {
//   api.get("/dashboard/owner")
//     .then((res) => {
//       console.log("dashboard response:", res.data);
//       setData(res.data.data);
//     })
//     .catch(console.error)
//     .finally(() => setLoading(false));
// }, []);

//   const kpis = [
//     {
//       title:    "Total Students",
//       value:    loading ? "—" : String(data?.total_students ?? 0),
//       icon:     Users,
//       color:    "text-blue-500",
//       bg:       "bg-blue-50 dark:bg-blue-950/40",
//       change:   null,
//       positive: true,
//       sub:      "active students",
//     },
//     {
//       title:    "Active Batches",
//       value:    loading ? "—" : String(data?.active_batches ?? 0),
//       icon:     CalendarDays,
//       color:    "text-violet-500",
//       bg:       "bg-violet-50 dark:bg-violet-950/40",
//       change:   null,
//       positive: true,
//       sub:      "running now",
//     },
//     {
//       title:    "Fee Collected",
//       value:    loading ? "—" : formatCurrency(
//                   (data?.total_revenue ?? 0) - (data?.pending_revenue ?? 0)
//                 ),
//       icon:     IndianRupee,
//       color:    "text-emerald-500",
//       bg:       "bg-emerald-50 dark:bg-emerald-950/40",
//       change:   loading ? null : `₹${((data?.pending_revenue ?? 0) / 1000).toFixed(1)}K pending`,
//       positive: false,
//       sub:      "total collected",
//     },
//     {
//       title:    "Attendance Rate",
//       value:    loading ? "—" : `${data?.avg_attendance_percent ?? 0}%`,
//       icon:     TrendingUp,
//       color:    "text-amber-500",
//       bg:       "bg-amber-50 dark:bg-amber-950/40",
//       change:   null,
//       positive: true,
//       sub:      "avg across batches",
//     },
//   ];

//   return (
//     <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//       {kpis.map((kpi, i) => (
//         <div
//           key={kpi.title}
//           className="rounded-xl border bg-card p-5 shadow-sm fade-in"
//           style={{ animationDelay: `${i * 60}ms` }}
//         >
//           <div className="flex items-start justify-between">
//             <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
//             <div className={`rounded-lg p-2 ${kpi.bg}`}>
//               <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
//             </div>
//           </div>
//           <p className={`mt-3 text-2xl font-bold tracking-tight ${loading ? "animate-pulse text-muted-foreground" : ""}`}>
//             {kpi.value}
//           </p>
//           <p className="mt-1 flex items-center gap-1 text-xs">
//             {kpi.change && (
//               <span className={kpi.positive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}>
//                 {kpi.change}
//               </span>
//             )}
//             <span className="text-muted-foreground">{kpi.sub}</span>
//           </p>
//         </div>
//       ))}
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { Users, CalendarDays, IndianRupee, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

interface OwnerDashboard {
  total_students: number;
  active_batches: number;
  total_leads: number;
  converted_leads: number;
  total_revenue: number;
  pending_revenue: number;
  total_exams: number;
  avg_attendance_percent: number;
}

function formatCurrency(val: number) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val}`;
}

export function KpiCards() {
  const [data, setData] = useState<OwnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/owner")
      .then((res) => {
        const result = res.data?.data ?? res.data;
        setData(result);
      })
      .catch((err) => {
        console.error("kpi error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 shadow-sm animate-pulse">
            <div className="h-4 w-24 bg-muted rounded mb-4" />
            <div className="h-8 w-16 bg-muted rounded mb-2" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title:    "Total Students",
      value:    String(data.total_students),
      icon:     Users,
      color:    "text-blue-500",
      bg:       "bg-blue-50 dark:bg-blue-950/40",
      change:   null,
      positive: true,
      sub:      "active students",
    },
    {
      title:    "Active Batches",
      value:    String(data.active_batches),
      icon:     CalendarDays,
      color:    "text-violet-500",
      bg:       "bg-violet-50 dark:bg-violet-950/40",
      change:   null,
      positive: true,
      sub:      "running now",
    },
    {
      title:    "Fee Collected",
      value:    formatCurrency(data.total_revenue - data.pending_revenue),
      icon:     IndianRupee,
      color:    "text-emerald-500",
      bg:       "bg-emerald-50 dark:bg-emerald-950/40",
      change:   `₹${(data.pending_revenue / 1000).toFixed(1)}K pending`,
      positive: false,
      sub:      "total collected",
    },
    {
      title:    "Attendance Rate",
      value:    `${data.avg_attendance_percent}%`,
      icon:     TrendingUp,
      color:    "text-amber-500",
      bg:       "bg-amber-50 dark:bg-amber-950/40",
      change:   null,
      positive: true,
      sub:      "avg across batches",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, i) => (
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
            {kpi.change && (
              <span className={kpi.positive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}>
                {kpi.change}
              </span>
            )}
            <span className="text-muted-foreground">{kpi.sub}</span>
          </p>
        </div>
      ))}
    </div>
  );
}