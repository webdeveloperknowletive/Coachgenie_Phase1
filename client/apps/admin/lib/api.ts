import { useAuthStore } from "@/lib/stores/auth.store";



// ✅ All calls go to /api/proxy/... (Next.js server reads cookie → forwards Bearer token to FastAPI)
const BASE = "/api/proxy";

function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string; detail?: string | any[] };
    const detail = Array.isArray(err.detail)
      ? err.detail.map((e: any) => e?.msg ?? e?.message ?? JSON.stringify(e)).join(", ")
      : err.detail;
    throw new Error(err.message ?? detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const fetchOpts = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: getHeaders(),
  credentials: "include",
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});

export const api = {
  get:    <T>(path: string) =>
    fetch(`${BASE}${path}`, fetchOpts("GET")).then(r => handleResponse<T>(r)),
  post:   <T>(path: string, body?: unknown) =>
    fetch(`${BASE}${path}`, fetchOpts("POST", body)).then(r => handleResponse<T>(r)),
  patch:  <T>(path: string, body?: unknown) =>
    fetch(`${BASE}${path}`, fetchOpts("PATCH", body)).then(r => handleResponse<T>(r)),
  delete: <T>(path: string) =>
    fetch(`${BASE}${path}`, fetchOpts("DELETE")).then(r => handleResponse<T>(r)),
};
