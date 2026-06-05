// lib/auth-headers.ts

export function authHeaders(): HeadersInit {
  let token: string | null = null;
  let tenantId: string | null = null;
  try {
    const raw   = localStorage.getItem("coachgenie-auth");
    const state = raw ? JSON.parse(raw)?.state : null;
    token    = state?.accessToken ?? null;
    tenantId = state?.tenantId    ?? null;
  } catch {}
  return {
    "Content-Type": "application/json",
    ...(token    ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { "X-Tenant-Id": tenantId }          : {}),
  };
}