"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────
interface Lead {
  id:               string;
  full_name:        string;
  phone:            string;
  email?:           string;
  parent_name?:     string;
  parent_phone?:    string;
  source?:          string;
  interested_course?:string;
  status:           string;
  notes?:           string;
  assigned_to?:     string;
  created_at:       string;
}

interface LeadCreate {
  full_name:         string;
  phone:             string;
  email?:            string;
  parent_name?:      string;
  parent_phone?:     string;
  source?:           string;
  interested_course?:string;
  notes?:            string;
  assigned_to?:      string;
}

// ── Hooks ────────────────────────────────────────────────────────
export function useLeads(params?: { status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);

  return useQuery({
    queryKey: ["leads", params],
    queryFn:  () => api.get<{ data: Lead[]; total: number }>(
      `/leads/?${query.toString()}`
    ),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ["leads", id],
    queryFn:  () => api.get<{ data: Lead }>(`/leads/${id}`),
    enabled:  !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeadCreate) => api.post("/leads/", data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeadCreate> & { status?: string } }) =>
      api.patch(`/leads/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useAddActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, type, description }: { leadId: string; type: string; description: string }) =>
      api.post(`/leads/${leadId}/activities`, { type, description }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["leads", vars.leadId] }),
  });
}
