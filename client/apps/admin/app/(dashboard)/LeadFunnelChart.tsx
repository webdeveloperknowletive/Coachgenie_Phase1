"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const DATA = [
  { stage: "Enquiries",  count: 320 },
  { stage: "Demo",       count: 210 },
  { stage: "Trial",      count: 145 },
  { stage: "Enrolled",   count: 98  },
  { stage: "Active",     count: 84  },
];

const COLORS = [
  "hsl(213 94% 40%)",
  "hsl(213 94% 50%)",
  "hsl(213 94% 58%)",
  "hsl(142 71% 45%)",
  "hsl(142 71% 38%)",
];

export function LeadFunnelChart() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm fade-in" style={{ animationDelay: "180ms" }}>
      <div className="mb-4">
        <h3 className="font-semibold">Lead Funnel</h3>
        <p className="text-xs text-muted-foreground">Enquiry to active student conversion</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={DATA} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={72} />
          <Tooltip />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {DATA.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}