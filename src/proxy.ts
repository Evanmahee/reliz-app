import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "reliz_session";

/**
 * Next.js 16 : préférer `proxy` à `middleware` (runtime Node par défaut).
 * Évite les plantages Edge sur Vercel avec la vérif JWT (jose).
 */
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    return NextResponse.next();
  }
  if (!token) {
    return NextResponse.redirect(new URL("/connexion", req.url));
  }
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/connexion", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/api/evenements/:path*",
  ],
};
