import { apiClient } from "../lib/axios";

export const aiService = {
  startSession: (feature: string, student_id?: string) =>
    apiClient.post("/ai/sessions", { feature, student_id }),

  chat:         (sessionId: string, message: string) =>
    apiClient.post(`/ai/sessions/${sessionId}/chat`, { message }),

  endSession:   (sessionId: string) =>
    apiClient.post(`/ai/sessions/${sessionId}/end`),

  getSessions:  () =>
    apiClient.get("/ai/sessions"),

  getMessages:  (sessionId: string) =>
    apiClient.get(`/ai/sessions/${sessionId}/messages`),

  getFeatures:  () =>
    apiClient.get("/ai/features"),
};