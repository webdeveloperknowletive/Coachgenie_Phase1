import { apiClient } from "../lib/axios";
import type { AuthUser } from "../stores/auth.store";

export interface LoginPayload { email: string; password: string; }
export interface LoginResponse {
  access_token:  string;
  refresh_token: string;
  token_type:    string;
  user:          AuthUser;
}

export const authService = {
  login: (data: LoginPayload) =>
    apiClient.post<LoginResponse>("/auth/login", data),

  me: () =>
    apiClient.get<{ success: boolean; data: AuthUser }>("/auth/me"),

  logout: (refresh_token: string) =>
    apiClient.post("/auth/logout", { refresh_token }),

  refresh: (refresh_token: string) =>
    apiClient.post<{ access_token: string; refresh_token: string }>("/auth/refresh", { refresh_token }),
};