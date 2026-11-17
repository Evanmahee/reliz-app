import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Pages autorisées après confirmation (pas de redirection vers un autre site). */
const ALLOWED_NEXT = new Set(["/nouveau-mot-de-passe", "/dashboard"]);

/**
 * Retour du lien reçu par email (réinitialisation du mot de passe).
 * Accepte ?code=… (PKCE) ou ?token_hash=…&type=recovery.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  const next = ALLOWED_NEXT.has(nextParam) ? nextParam : "/dashboard";
  const supabase = await createSupabaseServerClient();

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  return NextResponse.redirect(
    new URL(ok ? next : "/mot-de-passe-oublie?erreur=lien", url.origin),
  );
}
