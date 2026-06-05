// apps/admin/src/services/examsService.ts
import { api } from "@/lib/api";

export const examsService = {
  list:           ()                          => api.get("/exams/"),
  create:         (body: unknown)             => api.post("/exams/", body),
  update:         (id: string, body: unknown) => api.patch(`/exams/${id}`, body),
  saveResults:    (id: string, body: unknown) => api.post(`/exams/${id}/results`, body),
  getResults:     (id: string)                => api.get(`/exams/${id}/results`),
};