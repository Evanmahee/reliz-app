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

export class OwnerNotAllowedError extends Error {
  constructor(email: string) {
    super(`Compte traiteur non autorisé : ${email}`);
    this.name = "OwnerNotAllowedError";
  }
}

/**
 * Un compte Auth inconnu ne devient traiteur (OWNER) que s'il figure dans
 * OWNER_EMAILS (liste séparée par des virgules). Sans OWNER_EMAILS, seul le
 * tout premier traiteur peut être créé (installation neuve), ensuite c'est fermé.
 */
async function canBecomeOwner(email: string): Promise<boolean> {
  const allowed = (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length > 0) return allowed.includes(email);
  const owners = await prisma.user.count({ where: { role: USER_ROLE.OWNER } });
  return owners === 0;
}

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
  // Sans nom renseigné, on prend le début de l'email (sinon l'équipe voit
  // « Pris en charge par Utilisateur » sans savoir qui).
  const name =
    typeof nameMeta === "string" && nameMeta.trim()
      ? nameMeta.trim()
      : email.split("@")[0] || null;

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

  // Profil créé à la main (base de données) avec un autre identifiant que le
  // compte de connexion : on le relie au compte, seulement si son ancien
  // identifiant ne correspond à aucun compte de connexion existant.
  const byEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (byEmail) {
    const rows = await prisma.$queryRaw<{ n: number }[]>`
      select count(*)::int as n from auth.users where id::text = ${byEmail.id}`;
    if (rows[0]?.n === 0) {
      return prisma.user.update({
        where: { id: byEmail.id },
        data: { id: authUser.id },
        select: { id: true, email: true, name: true, role: true, employerId: true },
      });
    }
  }

  if (!(await canBecomeOwner(email))) {
    throw new OwnerNotAllowedError(email);
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
