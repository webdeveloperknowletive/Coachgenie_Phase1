// apps/admin/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/verify-otp", "/reset-password"];

export function middleware(request: NextRequest) {
  const token    = request.cookies.get("cg_access_token")?.value;
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!token && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (token && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|images).*)"],
};