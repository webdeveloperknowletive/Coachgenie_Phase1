// "use client";
// import { useEffect, useState } from "react";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
// import { api } from "@/lib/api";

// const COLORS = [
//   "hsl(213 94% 40%)", "hsl(213 94% 50%)", "hsl(213 94% 58%)",
//   "hsl(142 71% 45%)", "hsl(142 71% 38%)",
// ];

// export function LeadFunnelChart() {
//   const [data, setData] = useState<{ stage: string; count: number }[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//   api.get("/leads/funnel")
//     .then((res: any) => {
//       console.log("funnel response:", res.data); // check shape
//       const result = res.data?.data ?? res.data ?? [];
//       setData(Array.isArray(result) ? result : []);
//     })
//     .catch((err: unknown) => {
//       console.error("funnel error:", err);
//       setData([]);
//     })
//     .finally(() => setLoading(false));
// }, []);

//   return (
//     <div className="rounded-xl border bg-card p-5 shadow-sm fade-in" style={{ animationDelay: "180ms" }}>
//       <div className="mb-4">
//         <h3 className="font-semibold">Lead Funnel</h3>
//         <p className="text-xs text-muted-foreground">Enquiry to active student conversion</p>
//       </div>
//       {loading || data === undefined ? (
//         <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">
//           Loading...
//         </div>
//       ) :  data.length === 0 ? (
//         <ResponsiveContainer width="100%" height={220}>
//           <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
//             <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
//             <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
//             <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={72} />
//             <Tooltip />
//             <Bar dataKey="count" radius={[0, 4, 4, 0]}>
//               {/* {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)} */}
//               {(data ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
//             </Bar>
//           </BarChart>
//         </ResponsiveContainer>
//       )}
//     </div>
//   );
// }


"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "@/lib/api";

const COLORS = [
  "hsl(213 94% 40%)", "hsl(213 94% 50%)", "hsl(213 94% 58%)",
  "hsl(142 71% 45%)", "hsl(142 71% 38%)",
];

export function LeadFunnelChart() {
  const [data, setData] = useState<{ stage: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/leads/funnel")
      .then((res: any) => {
        console.log("funnel response:", res.data);
        const result = res.data?.data ?? res.data ?? [];
        setData(Array.isArray(result) ? result : []);
      })
      .catch((err: unknown) => {
        console.error("funnel error:", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm fade-in" style={{ animationDelay: "180ms" }}>
      <div className="mb-4">
        <h3 className="font-semibold">Lead Funnel</h3>
        <p className="text-xs text-muted-foreground">Enquiry to active student conversion</p>
      </div>
      {loading ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
          No lead data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={72} />
            <Tooltip />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
