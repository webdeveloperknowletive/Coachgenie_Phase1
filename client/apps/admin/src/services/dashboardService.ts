// apps/admin/src/services/dashboardService.ts
import { api } from "@/lib/api";

export const dashboardService = {
  stats:        () => api.get("/dashboard/stats"),
  revenue:      () => api.get("/dashboard/revenue"),
  leadsFunnel:  () => api.get("/dashboard/leads-funnel"),
  attendance:   () => api.get("/dashboard/attendance"),
  upcoming:     () => api.get("/dashboard/upcoming"),
};