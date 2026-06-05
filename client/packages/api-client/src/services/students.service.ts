import { apiClient } from "../lib/axios";

export interface StudentCreate {
  enrollment_no:  string;
  first_name:     string;
  last_name:      string;
  date_of_birth?: string;
  gender?:        string;
  email?:         string;
  phone?:         string;
  address?:       string;
  city?:          string;
  state?:         string;
  pincode?:       string;
  parent_name?:   string;
  parent_phone?:  string;
  parent_email?:  string;
  current_class?: string;
  target_exam?:   string;
  joined_at?:     string;
}

export const studentsService = {
  list:       (params?: { page?:number; limit?:number; search?:string }) =>
    apiClient.get("/students/", { params }),

  get:        (id: string) =>
    apiClient.get(`/students/${id}`),

  create:     (data: StudentCreate) =>
    apiClient.post("/students/", data),

  update:     (id: string, data: Partial<StudentCreate> & { is_active?: boolean }) =>
    apiClient.patch(`/students/${id}`, data),

  deactivate: (id: string) =>
    apiClient.delete(`/students/${id}`),
};