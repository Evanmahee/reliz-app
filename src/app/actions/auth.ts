"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from "@prisma/client/runtime/library";
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
    if (
      e instanceof PrismaClientInitializationError ||
      e instanceof PrismaClientKnownRequestError ||
      e instanceof PrismaClientUnknownRequestError
    ) {
      redirect("/connexion?erreur=db");
    }
    const msg = e instanceof Error ? e.message : "";
    if (/P1001|P1017|Can't reach database|timeout|ECONNREFUSED/i.test(msg)) {
      redirect("/connexion?erreur=db");
    }
    redirect("/connexion?erreur=serveur");
  }

  // Important : redirect() lève une exception interne Next.js — ne pas la piéger dans un try/catch.
  if (!user) {
    redirect("/connexion?erreur=identifiants");
  }
  if (!user.passwordHash) {
    redirect("/connexion?erreur=identifiants");
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/connexion?erreur=identifiants");
  }

  try {
    const token = await createSessionToken(user.id);
    await setSessionCookie(token);
  } catch (e) {
    console.error("[loginAction] session/cookie ou JWT", e);
    redirect("/connexion?erreur=session");
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/connexion");
}
