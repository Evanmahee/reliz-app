import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { USER_ROLE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/** Id auth.users (= public."User".id) ou null. Dédupliqué par requête RSC. */
export const getSessionUserId = cache(async (): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
});

/**
 * Assure une ligne profil dans public."User" pour l’utilisateur Auth.
 * Premier login → OWNER (sauf si déjà créé comme STAFF).
 */
export async function ensureUserProfile(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const email = (authUser.email ?? "").trim().toLowerCase();
  if (!email) throw new Error("Email Auth manquant");

  const nameMeta = authUser.user_metadata?.name;
  const name =
    typeof nameMeta === "string" && nameMeta.trim() ? nameMeta.trim() : null;

  const existing = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, email: true, name: true, role: true, employerId: true },
  });
  if (existing) {
    if (existing.email !== email) {
      return prisma.user.update({
        where: { id: authUser.id },
        data: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          employerId: true,
        },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      id: authUser.id,
      email,
      name,
      role: USER_ROLE.OWNER,
    },
    select: { id: true, email: true, name: true, role: true, employerId: true },
  });
}
