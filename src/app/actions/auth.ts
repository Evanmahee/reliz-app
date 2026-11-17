"use server";

import { redirect } from "next/navigation";
import { ensureUserProfile, OwnerNotAllowedError } from "@/lib/auth";
import { clearRateLimit, hitRateLimit } from "@/lib/rate-limit-db";
import { requestIp } from "@/lib/request-ip";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect("/connexion?erreur=champs");
  }
  if (email.length > 254 || password.length > 200) {
    redirect("/connexion?erreur=identifiants");
  }

  // Anti force brute : 10 essais / 15 min par compte, 30 par adresse IP.
  const ip = await requestIp();
  const emailKey = `login:email:${email}`;
  const allowed = await hitRateLimit([
    { key: `login:ip:${ip}`, limit: 30, windowMs: 15 * 60_000 },
    { key: emailKey, limit: 10, windowMs: 15 * 60_000 },
  ]);
  if (!allowed.ok) {
    redirect("/connexion?erreur=bloque");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    console.error("[loginAction] NEXT_PUBLIC_SUPABASE_URL manquant");
    redirect("/connexion?erreur=config");
  }
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  ) {
    console.error("[loginAction] clé Supabase anon/publishable manquante");
    redirect("/connexion?erreur=config");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    console.warn("[loginAction] échec de connexion");
    redirect("/connexion?erreur=identifiants");
  }

  // Collaborateur invité qui n'a pas encore activé son compte (lien + code email).
  if ((data.user.app_metadata as { pending_activation?: boolean } | undefined)?.pending_activation) {
    await supabase.auth.signOut();
    redirect("/connexion?erreur=nonactive");
  }

  try {
    await ensureUserProfile(data.user);
  } catch (e) {
    console.error("[loginAction] profil User:", e);
    await supabase.auth.signOut();
    if (e instanceof OwnerNotAllowedError) {
      redirect("/connexion?erreur=nonautorise");
    }
    redirect("/connexion?erreur=db");
  }

  await clearRateLimit(emailKey);
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
