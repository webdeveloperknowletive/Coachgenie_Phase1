// app/api/admissions/[id]/route.ts
import { NextResponse } from "next/server";

const API_BASE = `${process.env.API_URL ?? "http://localhost:8000"}/api/v1`;

function forwardHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth      = req.headers.get("authorization");
  const subdomain = req.headers.get("x-tenant-subdomain");
  const tenantId  = req.headers.get("x-tenant-id");
  if (auth)      headers["authorization"]      = auth;
  if (subdomain) headers["x-tenant-subdomain"] = subdomain;
  if (tenantId)  headers["x-tenant-id"]        = tenantId;
  return headers;
}

// GET /api/admissions/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const upstream = await fetch(`${API_BASE}/admissions/${id}`, {
    headers: forwardHeaders(req),
    cache:   "no-store",
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

// PATCH /api/admissions/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }  = await params;
  const body    = await req.json();

  const upstream = await fetch(`${API_BASE}/admissions/${id}`, {
    method:  "PATCH",
    headers: forwardHeaders(req),
    body:    JSON.stringify(body),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}