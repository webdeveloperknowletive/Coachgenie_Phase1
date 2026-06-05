// apps/admin/src/services/admissionsService.ts
import { api } from "@/lib/api";

export const admissionsService = {
  list:   ()                          => api.get("/admissions/"),
  get:    (id: string)                => api.get(`/admissions/${id}`),
  create: (body: unknown)             => api.post("/admissions/", body),
  update: (id: string, body: unknown) => api.patch(`/admissions/${id}`, body),
};