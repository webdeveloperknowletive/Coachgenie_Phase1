"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useStudentInvoices(studentId: string) {
  return useQuery({
    queryKey: ["fees", "student", studentId],
    queryFn:  () => api.get(`/fees/student/${studentId}`),
    enabled:  !!studentId,
  });
}

export function useFeeStructures() {
  return useQuery({
    queryKey: ["fees", "structures"],
    queryFn:  () => api.get("/fees/structures"),
  });
}

export function useRevenueSummary() {
  return useQuery({
    queryKey: ["fees", "revenue"],
    queryFn:  () => api.get("/fees/revenue/summary"),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post("/fees/invoices", data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      amount,
      payment_mode,
      transaction_ref,
      notes,
    }: {
      invoiceId:       string;
      amount:          number;
      payment_mode:    string;
      transaction_ref?:string;
      notes?:          string;
    }) =>
      api.post(`/fees/invoices/${invoiceId}/pay`, {
        amount, payment_mode, transaction_ref, notes,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}
