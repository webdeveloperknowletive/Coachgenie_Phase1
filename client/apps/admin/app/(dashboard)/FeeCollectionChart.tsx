"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const DATA = [
  { month: "Jul", fees: 310000 },
  { month: "Aug", fees: 280000 },
  { month: "Sep", fees: 390000 },
  { month: "Oct", fees: 420000 },
  { month: "Nov", fees: 365000 },
  { month: "Dec", fees: 480000 },
  { month: "Jan", fees: 445000 },
  { month: "Feb", fees: 510000 },
  { month: "Mar", fees: 490000 },
  { month: "Apr", fees: 480000 },
];

function fmt(v: number | string | undefined) {
  const value = Number(v ?? 0);
  return `₹${(value / 100000).toFixed(1)}L`;
}

export function FeeCollectionChart() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm fade-in" style={{ animationDelay: "120ms" }}>
      <div className="mb-4">
        <h3 className="font-semibold">Fee Collection</h3>
        <p className="text-xs text-muted-foreground">Monthly trend (current academic year)</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={DATA} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(213 94% 40%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(213 94% 40%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v) => [fmt(v as number), "Fees"]} />
          <Area
            type="monotone"
            dataKey="fees"
            stroke="hsl(213 94% 40%)"
            strokeWidth={2}
            fill="url(#feeGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

