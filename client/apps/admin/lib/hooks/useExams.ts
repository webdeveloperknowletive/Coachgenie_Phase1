"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useExams(batchId?: string) {
  return useQuery({
    queryKey: ["exams", batchId],
    queryFn:  () => api.get(`/exams/${batchId ? `?batch_id=${batchId}` : ""}`),
  });
}

export function useExamResults(examId: string) {
  return useQuery({
    queryKey: ["exams", examId, "results"],
    queryFn:  () => api.get(`/exams/${examId}/results`),
    enabled:  !!examId,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post("/exams/", data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useSubmitResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      examId,
      results,
    }: {
      examId:  string;
      results: { student_id: string; marks_obtained: number; remarks?: string }[];
    }) => api.post(`/exams/${examId}/results`, { results }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["exams", vars.examId, "results"] }),
  });
}