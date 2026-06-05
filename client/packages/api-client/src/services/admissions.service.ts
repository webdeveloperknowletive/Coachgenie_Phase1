import { apiClient } from "../lib/axios";

export const admissionsService = {
  list:   (params?: { page?:number; limit?:number; status?:string }) =>
    apiClient.get("/admissions/", { params }),

  get:    (id: string) =>
    apiClient.get(`/admissions/${id}`),

  create: (data: object) =>
    apiClient.post("/admissions/", data),

  update: (id: string, data: object) =>
    apiClient.patch(`/admissions/${id}`, data),
};