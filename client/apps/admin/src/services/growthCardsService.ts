// apps/admin/src/services/growthCardsService.ts
import { api } from "@/lib/api";

export const growthCardsService = {
  list:       ()                          => api.get("/growth-cards/"),
  getStudent: (studentId: string)         => api.get(`/growth-cards/student/${studentId}`),
  create:     (body: unknown)             => api.post("/growth-cards/", body),
  update:     (id: string, body: unknown) => api.patch(`/growth-cards/${id}`, body),
};