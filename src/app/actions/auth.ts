"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect("/connexion?erreur=champs");
  }

  if (!process.env.AUTH_SECRET?.trim()) {
    console.error("[loginAction] AUTH_SECRET manquant (ajoutez-la sur Vercel)");
    redirect("/connexion?erreur=config");
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("[loginAction] DATABASE_URL manquant");
    redirect("/connexion?erreur=config");
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    console.error("[loginAction]", e);
    if (e instanceof PrismaClientInitializationError) {
      redirect("/connexion?erreur=db");
    }
    const msg = e instanceof Error ? e.message : "";
    if (/P1001|P1017|Can't reach database/i.test(msg)) {
      redirect("/connexion?erreur=db");
    }
    redirect("/connexion?erreur=serveur");
  }

  // Important : redirect() lève une exception interne Next.js — ne pas la piéger dans un try/catch.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/connexion?erreur=identifiants");
  }

  const token = await createSessionToken(user.id);
  await setSessionCookie(token);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/connexion");
}
