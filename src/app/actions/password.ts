"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAppBaseUrl } from "@/lib/app-url";
import { brandedEmail, mailerConfigured, sendMail } from "@/lib/mailer";
import { checkPassword } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";
import { hitRateLimit } from "@/lib/rate-limit-db";
import { requestIp } from "@/lib/request-ip";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/**
 * Envoie l'email de réinitialisation. Réponse identique que le compte existe
 * ou non, et même en cas de blocage anti-abus (on ne révèle rien).
 */
export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) redirect("/mot-de-passe-oublie?envoye=1");

  const ip = await requestIp();
  const allowed = await hitRateLimit([
    { key: `reset:ip:${ip}`, limit: 5, windowMs: 60 * 60_000 },
    { key: `reset:email:${email}`, limit: 3, windowMs: 60 * 60_000 },
  ]);
  if (!allowed.ok) redirect("/mot-de-passe-oublie?envoye=1");

  const base = await getAppBaseUrl();
  try {
    if (mailerConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      // Lien généré côté serveur, email envoyé par Resend aux couleurs Reliz.
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
      });
      const tokenHash = data?.properties?.hashed_token;
      if (!error && tokenHash) {
        const url = `${base}/auth/confirmer?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=/nouveau-mot-de-passe`;
        const mail = brandedEmail({
          title: "Choisir un nouveau mot de passe",
          intro:
            "Vous avez demandé à réinitialiser le mot de passe de votre espace Reliz. Le lien ci-dessous est valable une heure et ne fonctionne qu’une fois.",
          buttonLabel: "Choisir mon mot de passe",
          url,
          outro:
            "Vous n’êtes pas à l’origine de cette demande ? Ignorez simplement cet email : votre mot de passe actuel reste valable.",
        });
        await sendMail({ to: email, subject: "Reliz — nouveau mot de passe", ...mail });
      }
    } else {
      // Repli : email standard envoyé par Supabase.
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${base}/auth/confirmer?next=/nouveau-mot-de-passe`,
      });
      if (error) console.error("[requestPasswordReset]", error.message);
    }
  } catch (e) {
    console.error("[requestPasswordReset]", e);
  }
  redirect("/mot-de-passe-oublie?envoye=1");
}

/** Nouveau mot de passe après le lien reçu par email. */
export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mot-de-passe-oublie?erreur=lien");

  const problem = checkPassword(password, user.email ?? "");
  if (problem) redirect(`/nouveau-mot-de-passe?erreur=${problem}`);
  if (password !== confirm) redirect("/nouveau-mot-de-passe?erreur=different");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[updatePassword]", error.message);
    redirect("/nouveau-mot-de-passe?erreur=echec");
  }
  // Toute autre session ouverte (autre téléphone, ordinateur oublié) est fermée.
  await supabase.auth.signOut({ scope: "others" });
  redirect("/dashboard");
}

/** Changement de mot de passe depuis « Mon compte » (mot de passe actuel exigé). */
export async function changePasswordAction(formData: FormData) {
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/connexion");

  const allowed = await hitRateLimit([
    { key: `pwchange:user:${user.id}`, limit: 5, windowMs: 15 * 60_000 },
  ]);
  if (!allowed.ok) redirect("/dashboard/compte?erreur=bloque");

  const problem = checkPassword(password, user.email);
  if (problem) redirect(`/dashboard/compte?erreur=${problem}`);
  if (password !== confirm) redirect("/dashboard/compte?erreur=different");
  if (password === current) redirect("/dashboard/compte?erreur=identique");

  const { error: badCurrent } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (badCurrent) redirect("/dashboard/compte?erreur=actuel");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[changePassword]", error.message);
    redirect("/dashboard/compte?erreur=echec");
  }
  await supabase.auth.signOut({ scope: "others" });
  redirect("/dashboard/compte?ok=motdepasse");
}

/** Nom affiché à l'équipe (« Pris en charge par … »). */
export async function updateDisplayNameAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  if (!name) redirect("/dashboard/compte?erreur=nom");
  await prisma.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/compte?ok=nom");
}

/** Déconnecte toutes les autres sessions (téléphone perdu, poste partagé…). */
export async function signOutOtherSessionsAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  await supabase.auth.signOut({ scope: "others" });
  redirect("/dashboard/compte?ok=sessions");
}
