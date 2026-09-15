"use server";

import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect("/connexion?erreur=champs");
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
    console.error("[loginAction] Auth:", error?.message);
    redirect("/connexion?erreur=identifiants");
  }

  try {
    await ensureUserProfile(data.user);
  } catch (e) {
    console.error("[loginAction] profil User:", e);
    await supabase.auth.signOut();
    redirect("/connexion?erreur=db");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
