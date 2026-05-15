"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updatePasswordAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    redirect("/dashboard/parametres?erreur=actuel");
  }
  if (next.length < 8) {
    redirect("/dashboard/parametres?erreur=court");
  }
  const passwordHash = await bcrypt.hash(next, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  redirect("/dashboard/parametres?ok=1");
}
