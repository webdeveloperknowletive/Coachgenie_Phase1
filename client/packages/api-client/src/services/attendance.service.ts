import { apiClient } from "../lib/axios";

export interface AttendanceRecord {
  student_id: string;
  status:     "present" | "absent" | "late";
  remarks?:   string;
}

export const attendanceService = {
  take: (data: { class_id: string; session_date: string; records: AttendanceRecord[] }) =>
    apiClient.post("/attendance/", data),

  getSessions: (classId: string) =>
    apiClient.get(`/attendance/class/${classId}`),

  getStudentSummary: (studentId: string) =>
    apiClient.get(`/attendance/student/${studentId}/summary`),
};