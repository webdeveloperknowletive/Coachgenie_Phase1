"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAdmissions(status?: string) {
  return useQuery({
    queryKey: ["admissions", status],
    queryFn:  () => api.get(`/admissions/${status ? `?status=${status}` : ""}`),
  });
}

export function useAdmission(id: string) {
  return useQuery({
    queryKey: ["admissions", id],
    queryFn:  () => api.get(`/admissions/${id}`),
    enabled:  !!id,
  });
}

export function useCreateAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post("/admissions/", data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admissions"] }),
  });
}

export function useUpdateAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch(`/admissions/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admissions"] }),
  });
}
