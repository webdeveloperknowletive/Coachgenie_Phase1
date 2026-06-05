// apps/admin/src/services/feesService.ts
import { api } from "@/lib/api";

export const feesService = {
  getStructures:      ()                          => api.get("/fees/structures"),
  createStructure:    (body: unknown)             => api.post("/fees/structures", body),
  getStudentLedger:   (studentId: string)         => api.get(`/fees/student/${studentId}`),
  createInvoice:      (body: unknown)             => api.post("/fees/invoices", body),
  recordPayment:      (invoiceId: string, body: unknown) => api.post(`/fees/invoices/${invoiceId}/pay`, body),
  getPayments:        (invoiceId: string)         => api.get(`/fees/invoices/${invoiceId}/payments`),
  revenueSummary:     ()                          => api.get("/fees/revenue/summary"),
};