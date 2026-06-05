

// app/api/proxy/[...path]/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const cookieStore = await cookies(); // ✅ await in Next.js 15
  const token = cookieStore.get("cg_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params; // ✅ await params in Next.js 15
  const search = request.nextUrl.search;
  const url = `${BACKEND}/${path.join("/")}${search}`;

  const headers: HeadersInit = {
    "Content-Type":       "application/json",
    "Authorization":      `Bearer ${token}`,
    "X-Tenant-Subdomain": process.env.NEXT_PUBLIC_TENANT_SUBDOMAIN ?? "demo",
  };

  const init: RequestInit = { method: request.method, headers };

  if (!["GET", "DELETE", "HEAD"].includes(request.method)) {
    init.body = await request.text();
  }

  const res = await fetch(url, init);
  const data = await res.text();

  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET    = handler;
export const POST   = handler;
export const PATCH  = handler;
export const PUT    = handler;
export const DELETE = handler;