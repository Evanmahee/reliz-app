import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "reliz_session";

/**
 * Ne pas utiliser uniquement NODE_ENV === "production" : en prod locale (`npm start`)
 * l’URL est souvent en http:// et les navigateurs refusent un cookie Secure → pas de session.
 */
export function shouldUseSecureSessionCookie(): boolean {
  const v = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (base.startsWith("https://")) return true;
  if (process.env.VERCEL === "1") return true;
  return false;
}

function getSecret() {
  const s = process.env.AUTH_SECRET?.trim();
  if (!s) throw new Error("AUTH_SECRET manquant");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

export async function getSessionUserId() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureSessionCookie(),
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureSessionCookie(),
  });
}
