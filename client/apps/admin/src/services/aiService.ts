// apps/admin/src/services/aiService.ts
import { api } from "@/lib/api";

export const aiService = {
  getFeatures:    ()                          => api.get("/ai/features"),
  startSession:   (body: unknown)             => api.post("/ai/sessions", body),
  chat:           (sessionId: string, body: unknown) => api.post(`/ai/sessions/${sessionId}/chat`, body),
  getMessages:    (sessionId: string)         => api.get(`/ai/sessions/${sessionId}/messages`),
  endSession:     (sessionId: string)         => api.post(`/ai/sessions/${sessionId}/end`, {}),
};