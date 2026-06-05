// apps/admin/src/services/batchesService.ts
import { api } from "@/lib/api";

export const batchesService = {
  list:           ()                              => api.get("/batches/"),
  get:            (id: string)                    => api.get(`/batches/${id}`),
  create:         (body: unknown)                 => api.post("/batches/", body),
  enroll:         (batchId: string, studentId: string) => api.post(`/batches/${batchId}/enroll/${studentId}`, {}),
  unenroll:       (batchId: string, studentId: string) => api.delete(`/batches/${batchId}/enroll/${studentId}`),
  getClasses:     (batchId: string)               => api.get(`/batches/${batchId}/classes`),
  createClass:    (body: unknown)                 => api.post("/batches/classes", body),
  updateClass:    (id: string, body: unknown)     => api.patch(`/batches/classes/${id}`, body),
  getSubjects:    ()                              => api.get("/batches/subjects"),
  createSubject:  (body: unknown)                 => api.post("/batches/subjects", body),
};