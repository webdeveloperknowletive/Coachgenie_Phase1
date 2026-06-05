
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
  "/api/auth",
];

function getSecret(): Uint8Array {
  const secret = process.env.SECRET_KEY;
  if (!secret) {
    console.error("[middleware] SECRET_KEY is not set — all protected routes denied");
    return new Uint8Array(0);
  }
  return new TextEncoder().encode(secret);
}

interface CgTokenPayload extends JWTPayload {
  sub:       string;
  tenant_id: string;
  role:      string;
}

async function verifyToken(token: string): Promise<CgTokenPayload | null> {
  try {
    const secret = getSecret();
    if (secret.length === 0) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload as CgTokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token    = request.cookies.get("cg_access_token")?.value;
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Authenticated user hitting /login → redirect to dashboard
  if (token && pathname.startsWith("/login")) {
    const payload = await verifyToken(token);
    if (payload) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Unauthenticated user hitting a protected route
  if (!token && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Token present on protected route — verify it
  if (token && !isPublic) {
    const payload = await verifyToken(token);

    if (!payload) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      const response = NextResponse.redirect(url);
      response.cookies.set("cg_access_token", "", {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "strict",
        path:     "/",
        maxAge:   0,
      });
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id",   payload.sub);
    requestHeaders.set("x-tenant-id", payload.tenant_id);
    requestHeaders.set("x-user-role", payload.role);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|images).*)"],
};
