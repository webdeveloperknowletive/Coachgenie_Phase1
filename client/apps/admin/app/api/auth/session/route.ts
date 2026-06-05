// app/api/auth/session/route.ts
// Receives tokens from the FastAPI backend (forwarded by login page),
// sets them as HttpOnly cookies — tokens NEVER accessible to JavaScript after this point.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_TOKEN_MAX_AGE  = 60 * 15;        // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token, user } = body;

    if (!access_token || !refresh_token || !user) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Return only non-sensitive display state to the client.
    // Tokens are set as cookies here — never returned in the JSON body.
    const response = NextResponse.json({
      user: {
        id:         user.id,
        email:      user.email,
        first_name: user.first_name,
        last_name:  user.last_name,
        role:       user.role,
        tenant_id:  user.tenant_id,
      },
    });

    // Access token — short-lived, HttpOnly, Secure, SameSite=Strict
    response.cookies.set("cg_access_token", access_token, {
      httpOnly:  true,
      secure:    process.env.NODE_ENV === "production",
      sameSite:  "strict",
      path:      "/",
      maxAge:    ACCESS_TOKEN_MAX_AGE,
    });

    // Refresh token — longer-lived, locked to the refresh path only
    response.cookies.set("cg_refresh_token", refresh_token, {
      httpOnly:  true,
      secure:    process.env.NODE_ENV === "production",
      sameSite:  "strict",
      path:      "/api/auth",   // only sent to our own auth API routes
      maxAge:    REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// Called by useLogout — clears both cookies server-side
export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set("cg_access_token", "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    path:     "/",
    maxAge:   0,
  });

  response.cookies.set("cg_refresh_token", "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    path:     "/api/auth",
    maxAge:   0,
  });

  return response;
}