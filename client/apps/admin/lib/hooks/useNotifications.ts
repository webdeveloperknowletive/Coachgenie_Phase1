"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useNotificationTemplates() {
  return useQuery({
    queryKey: ["notifications", "templates"],
    queryFn:  () => api.get("/notifications/templates"),
  });
}

export function useNotificationLogs() {
  return useQuery({
    queryKey: ["notifications", "logs"],
    queryFn:  () => api.get("/notifications/logs"),
  });
}

export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      template_id:    string;
      recipient_ids:  string[];
      variables?:     Record<string, string>;
    }) => api.post("/notifications/send", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "logs"] }),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post("/notifications/templates", data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["notifications", "templates"] }),
  });
}
