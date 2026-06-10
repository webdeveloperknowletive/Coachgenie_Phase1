// "use client";
// import { useMutation, useQuery } from "@tanstack/react-query";
// import { useRouter } from "next/navigation";
// import { api } from "@/lib/api";
// import { useAuthStore, type AuthUser } from "@/lib/stores/auth.store";

// interface LoginResponse {
//   access_token:  string;
//   refresh_token: string;
//   user:          AuthUser;
// }

// export function useLogin() {
//   const setAuth  = useAuthStore(s => s.setAuth);
//   const router   = useRouter();

//   return useMutation({
//     mutationFn: (data: { email: string; password: string }) =>
//       api.post<LoginResponse>("/auth/login", data),

//     onSuccess: (res) => {
//       const { access_token, refresh_token, user } = res;
//       setAuth(access_token, refresh_token, user);
//       document.cookie = `cg_access_token=${access_token}; path=/; max-age=3600; SameSite=Lax`;
//       router.push("/dashboard");
//     },
//   });
// }

// export function useLogout() {
//   const { refreshToken, clear } = useAuthStore();
//   const router = useRouter();

//   return useMutation({
//     mutationFn: () =>
//       api.post("/auth/logout", { refresh_token: refreshToken }),
//     onSettled: () => {
//       clear();
//       document.cookie = "cg_access_token=; path=/; max-age=0";
//       router.push("/login");
//     },
//   });
// }

// export function useMe() {
//   const token = useAuthStore(s => s.accessToken);
//   return useQuery({
//     queryKey: ["auth", "me"],
//     queryFn:  () => api.get<{ data: AuthUser }>("/auth/me"),
//     enabled:  !!token,
//   });
// }

// export function useForgotPassword() {
//   return useMutation({
//     mutationFn: (email: string) =>
//       api.post("/auth/forgot-password", { email }),
//   });
// }

// export function useVerifyOtp() {
//   return useMutation({
//     mutationFn: (data: { email: string; otp: string }) =>
//       api.post("/auth/verify-otp", data),
//   });
// }

// export function useResetPassword() {
//   return useMutation({
//     mutationFn: (data: { email: string; otp: string; new_password: string }) =>
//       api.post("/auth/reset-password", data),
//   });
// }

// export function useChangePassword() {
//   return useMutation({
//     mutationFn: (data: { current_password: string; new_password: string }) =>
//       api.post("/auth/change-password", data),
//   });
// }

// lib/hooks/useAuth.ts
// SECURITY FIX:
//   BEFORE: onSuccess → setAuth(tokens) + document.cookie write; logout → clear() + document.cookie clear
//   AFTER:  onSuccess → POST /api/auth/session (server sets cookie) → setUser(display state)
//           logout    → DELETE /api/auth/session (server clears cookie) → clear()
//   No hook reads tokens from localStorage or document.cookie anywhere.

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
  const setUser = useAuthStore((s) => s.setUser);
  const router  = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<LoginResponse>("/auth/login", data),

    onSuccess: async (res) => {
      const { access_token, refresh_token, user } = res;

      // Hand tokens to the server-side session route.
      // Cookies are set HttpOnly there — never readable by JS here.
      const sessionRes = await fetch("/api/auth/session", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ access_token, refresh_token, user }),
      });

      if (!sessionRes.ok) throw new Error("Failed to establish session");

      const { user: safeUser } = await sessionRes.json();

      // Only display state goes into Zustand — no tokens
      setUser(safeUser);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const clear  = useAuthStore((s) => s.clear);
  const router = useRouter();

  return useMutation({
    mutationFn: () =>
      // DELETE clears HttpOnly cookies server-side.
      // Also calls FastAPI logout to invalidate the refresh token on the backend.
      Promise.all([
        fetch("/api/auth/session", { method: "DELETE" }),
        api.post("/auth/logout", {}).catch(() => {}), // best-effort
      ]),

    onSettled: () => {
      clear();        // wipes display state from Zustand + localStorage
      router.push("/login");
    },
  });
}

export function useMe() {
  // No token read — the HttpOnly cookie is attached automatically by the browser
  // on same-origin requests. useMe existence in Zustand user is the auth signal.
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn:  () => api.get<{ data: AuthUser }>("/auth/me"),
    enabled:  !!user,
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
