import { apiClient } from "../lib/axios";

export const feesService = {
  getStructures:    () =>
    apiClient.get("/fees/structures"),

  createStructure:  (data: object) =>
    apiClient.post("/fees/structures", data),

  getStudentInvoices: (studentId: string) =>
    apiClient.get(`/fees/student/${studentId}`),

  createInvoice:    (data: object) =>
    apiClient.post("/fees/invoices", data),

  recordPayment:    (invoiceId: string, data: { amount:number; mode:string; reference_no?:string; notes?:string }) =>
    apiClient.post(`/fees/invoices/${invoiceId}/pay`, data),

  getPayments:      (invoiceId: string) =>
    apiClient.get(`/fees/invoices/${invoiceId}/payments`),

  getRevenueSummary: () =>
    apiClient.get("/fees/revenue/summary"),
};