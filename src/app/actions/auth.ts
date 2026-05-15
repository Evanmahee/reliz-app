"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
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
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      redirect("/connexion?erreur=identifiants");
    }
    const token = await createSessionToken(user.id);
    await setSessionCookie(token);
    redirect("/dashboard");
  } catch (e) {
    console.error("[loginAction]", e);
    redirect("/connexion?erreur=serveur");
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/connexion");
}
