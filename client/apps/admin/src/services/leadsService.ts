// apps/admin/src/services/leadsService.ts
import { api } from "@/lib/api";

export const leadsService = {
  list:               ()                       => api.get("/leads/"),
  get:                (id: string)             => api.get(`/leads/${id}`),
  create:             (body: unknown)          => api.post("/leads/", body),
  update:             (id: string, body: unknown) => api.patch(`/leads/${id}`, body),
  delete:             (id: string)             => api.delete(`/leads/${id}`),
  getActivities:      (id: string)             => api.get(`/leads/${id}/activities`),
  addActivity:        (id: string, body: unknown) => api.post(`/leads/${id}/activities`, body),
};