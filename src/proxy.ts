import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy-session";

/**
 * Garde légère dashboard / API : session Supabase présente.
 * getUser() dans le proxy rafraîchit aussi les cookies.
 */
export async function proxy(req: NextRequest) {
  const { response, userId } = await updateSupabaseSession(req);
  if (!userId) {
    const redirect = NextResponse.redirect(new URL("/connexion", req.url));
    for (const c of response.cookies.getAll()) {
      redirect.cookies.set(c);
    }
    return redirect;
  }
  return response;
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/api/evenements/:path*",
    "/api/events/:path*",
    "/api/requests/:id/claim",
    "/api/requests/:id/unclaim",
  ],
};
