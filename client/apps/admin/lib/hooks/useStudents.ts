"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Student {
  id:             string;
  enrollment_no:  string;
  first_name:     string;
  last_name:      string;
  email?:         string;
  phone?:         string;
  current_class?: string;
  target_exam?:   string;
  parent_name?:   string;
  parent_phone?:  string;
  is_active:      boolean;
  joined_at:      string;
}

export function useStudents(params?: { search?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);

  return useQuery({
    queryKey: ["students", params],
    queryFn:  () => api.get<{ data: Student[] }>(`/students/?${query.toString()}`),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ["students", id],
    queryFn:  () => api.get<{ data: Student }>(`/students/${id}`),
    enabled:  !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Student> & { enrollment_no: string; first_name: string; last_name: string }) =>
      api.post("/students/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
      api.patch(`/students/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}
