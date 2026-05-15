import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "reliz_session";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
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
  matcher: ["/dashboard/:path*", "/api/evenements/:path*"],
};
