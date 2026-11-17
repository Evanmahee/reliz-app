"use server";

import { redirect } from "next/navigation";
import { getAppBaseUrl } from "@/lib/app-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Envoie l'email de réinitialisation. Réponse identique que le compte existe
 * ou non (on ne révèle pas quels emails sont inscrits).
 */
export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email && email.length <= 200 && email.includes("@")) {
    const supabase = await createSupabaseServerClient();
    const base = await getAppBaseUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${base}/auth/confirmer?next=/nouveau-mot-de-passe`,
    });
    if (error) console.error("[requestPasswordReset]", error.message);
  }
  redirect("/mot-de-passe-oublie?envoye=1");
}

/** Enregistre le nouveau mot de passe (session ouverte par le lien reçu). */
export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) redirect("/nouveau-mot-de-passe?erreur=court");
  if (password !== confirm) redirect("/nouveau-mot-de-passe?erreur=different");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mot-de-passe-oublie?erreur=lien");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[updatePassword]", error.message);
    redirect("/nouveau-mot-de-passe?erreur=echec");
  }
  redirect("/dashboard");
}
