"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsService } from "../services/leads.service";
import { queryKeys }    from "../query-keys";

export function useLeads(params?: { page?:number; limit?:number; status?:string; search?:string }) {
  return useQuery({
    queryKey: [...queryKeys.leads.all(""), params],
    queryFn:  () => leadsService.list(params).then(r => r.data),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id),
    queryFn:  () => leadsService.get(id).then(r => r.data.data),
    enabled:  !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leadsService.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      leadsService.update(id, data as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leadsService.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useAddActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: { type: string; description: string } }) =>
      leadsService.addActivity(leadId, data),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: queryKeys.leads.detail(vars.leadId) }),
  });
}