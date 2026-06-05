// apps/admin/src/services/studentsService.ts
import { api } from "@/lib/api";

export const studentsService = {
  list:   ()                          => api.get("/students/"),
  get:    (id: string)                => api.get(`/students/${id}`),
  create: (body: unknown)             => api.post("/students/", body),
  update: (id: string, body: unknown) => api.patch(`/students/${id}`, body),
  delete: (id: string)                => api.delete(`/students/${id}`),
};