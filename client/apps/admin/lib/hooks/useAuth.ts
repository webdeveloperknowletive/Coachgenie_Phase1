

"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/lib/stores/auth.store";

interface LoginResponse {
  access_token:  string;
  refresh_token: string;
  user:          AuthUser;
}

export function useLogin() {
  const setAuth  = useAuthStore(s => s.setAuth);
  const router   = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<LoginResponse>("/auth/login", data),

    onSuccess: (res) => {
      const { access_token, refresh_token, user } = res;
      setAuth(access_token, refresh_token, user);
      document.cookie = `cg_access_token=${access_token}; path=/; max-age=3600; SameSite=Lax`;
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const { refreshToken, clear } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () =>
      api.post("/auth/logout", { refresh_token: refreshToken }),
    onSettled: () => {
      clear();
      document.cookie = "cg_access_token=; path=/; max-age=0";
      router.push("/login");
    },
  });
}

export function useMe() {
  const token = useAuthStore(s => s.accessToken);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn:  () => api.get<{ data: AuthUser }>("/auth/me"),
    enabled:  !!token,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post("/auth/forgot-password", { email }),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: { email: string; otp: string }) =>
      api.post("/auth/verify-otp", data),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { email: string; otp: string; new_password: string }) =>
      api.post("/auth/reset-password", data),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      api.post("/auth/change-password", data),
  });
}