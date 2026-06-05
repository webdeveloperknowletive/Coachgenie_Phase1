// import axios, { type AxiosInstance } from "axios";
// import { useAuthStore } from "../stores/auth.store";

// export function createApiClient(baseURL: string): AxiosInstance {
//   const client = axios.create({
//     baseURL,
//     timeout: 15_000,
//     headers: { "Content-Type": "application/json" },
//   });

//   // Inject auth token
//   client.interceptors.request.use((config) => {
//     const token = useAuthStore.getState().accessToken;
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });

//   // Handle 401 — clear session
//   client.interceptors.response.use(
//     (res) => res,
//     (error: unknown) => {
//       if (axios.isAxiosError(error) && error.response?.status === 401) {
//         useAuthStore.getState().clear();
//         if (typeof window !== "undefined") window.location.href = "/login";
//       }
//       return Promise.reject(error);
//     }
//   );

//   return client;
// }

// export const apiClient = createApiClient(
//   process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
// );


import axios, { type AxiosInstance, type AxiosError } from "axios";
import { useAuthStore } from "../stores/auth.store";

export function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 15_000,
    headers: { "Content-Type": "application/json" },
  });

  // ── Request: inject auth token + tenant headers ──────────────
  client.interceptors.request.use((config) => {
    const { accessToken, tenantId } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Backend requires x-tenant-id on every request
    const tid = tenantId ?? process.env.NEXT_PUBLIC_TENANT_ID ?? "";
    if (tid) {
      config.headers["x-tenant-id"] = tid;
    }

    return config;
  });

  // ── Response: handle 401 with token refresh ──────────────────
  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const { refreshToken, setAuth, clear } = useAuthStore.getState();

        if (refreshToken) {
          try {
            const res = await axios.post(
              `${baseURL}/auth/refresh`,
              { refresh_token: refreshToken }
            );
            const { access_token, refresh_token } = res.data;
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              setAuth(access_token, refresh_token, currentUser);
            }
            originalRequest.headers!.Authorization = `Bearer ${access_token}`;
            return client(originalRequest);
          } catch {
            clear();
            if (typeof window !== "undefined") window.location.href = "/login";
          }
        } else {
          clear();
          if (typeof window !== "undefined") window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"
);