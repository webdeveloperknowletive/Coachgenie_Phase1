import type { Metadata }           from "next";
import { KpiCards }                from "@/components/dashboard/KpiCards";
import { FeeCollectionChart }      from "@/components/dashboard/FeeCollectionChart";
import { LeadFunnelChart }         from "@/components/dashboard/LeadFunnelChart";
import { AttendanceHeatmap }       from "@/components/dashboard/AttendanceHeatmap";
import { AnalyticsChatBubble }     from "@/components/ai/AnalyticsChatBubble";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";


export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, Rahul. Here's what's happening today.
        </p>
      </div>

      <KpiCards />

      <div className="grid gap-4 lg:grid-cols-2">
        <FeeCollectionChart />
        <LeadFunnelChart />
      </div>

      <AttendanceHeatmap />

      {/* AI Copilot inline widget */}
      <AnalyticsChatBubble />
    </div>
  );
}