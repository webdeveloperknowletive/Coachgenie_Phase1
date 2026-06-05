import { apiClient } from "../lib/axios";

export const batchesService = {
  list:          (params?: { page?:number; limit?:number }) =>
    apiClient.get("/batches/", { params }),

  create:        (data: object) =>
    apiClient.post("/batches/", data),

  update:        (id: string, data: object) =>
    apiClient.patch(`/batches/${id}`, data),

  enroll:        (batchId: string, studentId: string) =>
    apiClient.post(`/batches/${batchId}/enroll/${studentId}`),

  removeStudent: (batchId: string, studentId: string) =>
    apiClient.delete(`/batches/${batchId}/enroll/${studentId}`),

  getClasses:    (batchId: string) =>
    apiClient.get(`/batches/${batchId}/classes`),

  createClass:   (data: object) =>
    apiClient.post("/batches/classes", data),

  updateClass:   (classId: string, data: object) =>
    apiClient.patch(`/batches/classes/${classId}`, data),

  getSubjects:   () =>
    apiClient.get("/batches/subjects"),

  createSubject: (data: object) =>
    apiClient.post("/batches/subjects", data),
};