"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useBatches() {
  return useQuery({
    queryKey: ["batches"],
    queryFn:  () => api.get<{ data: unknown[] }>("/batches/"),
  });
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, studentId }: { batchId: string; studentId: string }) =>
      api.post(`/batches/${batchId}/enroll/${studentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post("/batches/", data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });
}