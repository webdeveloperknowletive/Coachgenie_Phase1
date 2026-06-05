import * as React from "react";
import { cn } from "../lib/utils";
import { Skeleton } from "./Skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  loading?: boolean;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, loading, className }: StatCardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-xl border bg-card p-6 shadow-sm", className)}>
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      {trend && (
        <p className={cn("mt-2 text-xs font-medium", trend.value >= 0 ? "text-success-600" : "text-danger-500")}>
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}