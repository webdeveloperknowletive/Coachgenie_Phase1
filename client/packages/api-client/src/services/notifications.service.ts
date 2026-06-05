import { apiClient } from "../lib/axios";

export const notificationsService = {
  getTemplates:  () =>
    apiClient.get("/notifications/templates"),

  createTemplate:(data: object) =>
    apiClient.post("/notifications/templates", data),

  send:          (data: { template_id:string; recipient_ids:string[]; variables:Record<string,string> }) =>
    apiClient.post("/notifications/send", data),

  getLogs:       () =>
    apiClient.get("/notifications/logs"),
};