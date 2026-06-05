// apps/admin/src/services/attendanceService.ts
import { api } from "@/lib/api";

export const attendanceService = {
  save:           (body: unknown)  => api.post("/attendance/", body),
  getByClass:     (classId: string) => api.get(`/attendance/class/${classId}`),
  getStudentSummary: (studentId: string) => api.get(`/attendance/student/${studentId}/summary`),
};