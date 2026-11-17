"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { hitRateLimit } from "@/lib/rate-limit-db";
import { requestIp } from "@/lib/request-ip";
import { completeActivation, loadInvite, sendActivationCode } from "@/lib/staff-invite";

function back(jeton: string, extra: string) {
  return `/activation?jeton=${encodeURIComponent(jeton)}&${extra}`;
}

/** Étape 2 : le collaborateur demande son code (envoyé sur sa boîte mail). */
export async function requestActivationCodeAction(formData: FormData) {
  const jeton = String(formData.get("jeton") ?? "").slice(0, 300);
  const invite = await loadInvite(jeton);
  if (!invite) redirect("/activation?erreur=lien");

  const allowed = await hitRateLimit([
    { key: `activation:send:${invite.userId}`, limit: 3, windowMs: 15 * 60_000 },
    { key: `activation:send:ip:${await requestIp()}`, limit: 10, windowMs: 60 * 60_000 },
  ]);
  if (!allowed.ok) redirect(back(jeton, "erreur=bloque"));

  const ok = await sendActivationCode(invite.email);
  redirect(back(jeton, ok ? "etape=code" : "erreur=envoi"));
}

/** Étape 3 : vérification du code → compte activé, lien désormais inutilisable. */
export async function verifyActivationCodeAction(formData: FormData) {
  const jeton = String(formData.get("jeton") ?? "").slice(0, 300);
  const code = String(formData.get("code") ?? "").replace(/\D/g, "").slice(0, 10);
  const invite = await loadInvite(jeton);
  if (!invite) redirect("/activation?erreur=lien");

  // 5 essais / 15 min : un code à 6 chiffres ne se devine pas.
  const allowed = await hitRateLimit([
    { key: `activation:verify:${invite.userId}`, limit: 5, windowMs: 15 * 60_000 },
  ]);
  if (!allowed.ok) redirect(back(jeton, "etape=code&erreur=bloque"));
  if (code.length < 6) redirect(back(jeton, "etape=code&erreur=code"));

  // Client sans cookies : on vérifie le code sans ouvrir de session dans le navigateur.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.auth.verifyOtp({
    email: invite.email,
    token: code,
    type: "email",
  });
  if (error || data.user?.id !== invite.userId) {
    redirect(back(jeton, "etape=code&erreur=code"));
  }
  await supabase.auth.signOut();
  await completeActivation(invite.userId);
  redirect("/connexion?ok=active");
}
