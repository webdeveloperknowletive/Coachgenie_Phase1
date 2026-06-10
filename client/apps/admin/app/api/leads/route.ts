import { NextResponse } from "next/server";

const API_BASE = `${process.env.API_URL ?? "http://localhost:8000"}/api/v1`;

function forwardHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth      = req.headers.get("authorization");
  const tenantId  = req.headers.get("x-tenant-id");
  if (auth)     headers["authorization"]  = auth;
  if (tenantId) headers["x-tenant-id"]    = tenantId;
  return headers;
}

// GET — list leads
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const upstream = await fetch(
    `${API_BASE}/leads/?${searchParams.toString()}`,
    { headers: forwardHeaders(req), cache: "no-store" },
  );
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

// POST — create lead
export async function POST(req: Request) {
  const body     = await req.json();
  const upstream = await fetch(`${API_BASE}/leads/`, {
    method:  "POST",
    headers: forwardHeaders(req),
    body:    JSON.stringify(body),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
