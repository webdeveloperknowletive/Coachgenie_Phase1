"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface AttendanceRecord {
  student_id: string;
  status:     "present" | "absent" | "late";
  remarks?:   string;
}

export function useAttendanceSummary(studentId: string) {
  return useQuery({
    queryKey: ["attendance", "summary", studentId],
    queryFn:  () => api.get(`/attendance/student/${studentId}/summary`),
    enabled:  !!studentId,
  });
}

export function useClassSessions(classId: string) {
  return useQuery({
    queryKey: ["attendance", "class", classId],
    queryFn:  () => api.get(`/attendance/class/${classId}`),
    enabled:  !!classId,
  });
}

export function useTakeAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      sessionDate,
      records,
    }: {
      classId:     string;
      sessionDate: string;
      records:     AttendanceRecord[];
    }) =>
      api.post("/attendance/", {
        class_id:     classId,
        session_date: sessionDate,
        records,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}