// apps/admin/src/services/notificationsService.ts
import { api } from "@/lib/api";

export const notificationsService = {
  getTemplates:   ()              => api.get("/notifications/templates"),
  createTemplate: (body: unknown) => api.post("/notifications/templates", body),
  send:           (body: unknown) => api.post("/notifications/send", body),
  getLogs:        ()              => api.get("/notifications/logs"),
};