import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "reliz_session";

/**
 * Garde légère : cookie présent + AUTH_SECRET configuré.
 * La vérif JWT réelle est faite dans les Server Components / routes API — évite les
 * réponses redirect depuis le proxy sur les navigations RSC (retour arrière, prefetch).
 */
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!process.env.AUTH_SECRET?.trim()) {
    return NextResponse.next();
  }
  if (!token?.trim()) {
    return NextResponse.redirect(new URL("/connexion", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/api/evenements/:path*",
  ],
};
