import { apiClient } from "../lib/axios";

export const examsService = {
  list:    (params?: { page?:number; limit?:number; batch_id?:string }) =>
    apiClient.get("/exams/", { params }),

  create:  (data: object) =>
    apiClient.post("/exams/", data),

  update:  (id: string, data: object) =>
    apiClient.patch(`/exams/${id}`, data),

  submitResults: (examId: string, results: { student_id:string; marks_obtained:number; remarks?:string }[]) =>
    apiClient.post(`/exams/${examId}/results`, { results }),

  getResults: (examId: string) =>
    apiClient.get(`/exams/${examId}/results`),
};