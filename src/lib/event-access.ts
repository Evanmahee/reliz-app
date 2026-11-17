import { cache } from "react";
import type { Event, User } from "@prisma/client";
import { getSessionUserId } from "@/lib/auth";
import { USER_ROLE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type SessionUser = Pick<
  User,
  "id" | "role" | "employerId" | "email" | "name"
>;

export function getOwnerId(user: SessionUser): string {
  if (
    (user.role === USER_ROLE.STAFF ||
      user.role === USER_ROLE.MAITRE_HOTEL) &&
    user.employerId
  ) {
    return user.employerId;
  }
  return user.id;
}

/** Profil User — une seule requête Prisma par userId et par navigation RSC. */
export const getSessionUser = cache(
  async (userId: string): Promise<SessionUser | null> => {
    const [profile, suspended] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, employerId: true, email: true, name: true },
      }),
      isSuspended(userId),
    ]);
    // Compte suspendu par le traiteur : session ignorée immédiatement,
    // même si le jeton de connexion n'a pas encore expiré.
    return suspended ? null : profile;
  },
);

/** Accès suspendu (banned_until dans Supabase Auth) ? */
async function isSuspended(userId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ banned: boolean }[]>`
      select coalesce(banned_until > now(), false) as banned
      from auth.users where id::text = ${userId}`;
    return rows[0]?.banned ?? false;
  } catch {
    return false;
  }
}

/** Membres suspendus parmi une liste d'identifiants. */
export async function suspendedUserIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      select id::text as id from auth.users
      where id::text = any(${ids}) and banned_until > now()`;
    return new Set(rows.map((r) => r.id));
  } catch {
    return new Set();
  }
}

/** Événement appartenant au traiteur ou accessible au serveur / MH. */
export async function assertEventAccess(
  eventId: string,
  user: SessionUser,
): Promise<Event> {
  if (user.role === USER_ROLE.OWNER) {
    const ev = await prisma.event.findFirst({
      where: { id: eventId, ownerId: user.id },
    });
    if (!ev) throw new Error("Événement introuvable");
    return ev;
  }

  const ownerId = getOwnerId(user);

  if (user.role === USER_ROLE.MAITRE_HOTEL) {
    const ev = await prisma.event.findFirst({
      where: { id: eventId, ownerId },
    });
    if (!ev) throw new Error("Événement introuvable");
    return ev;
  }

  const ev = await prisma.event.findFirst({
    where: {
      id: eventId,
      ownerId,
      staffAccess: { some: { userId: user.id } },
    },
  });
  if (!ev) throw new Error("Événement introuvable");
  return ev;
}

export async function listAccessibleLiveEventIds(
  user: SessionUser,
): Promise<string[]> {
  if (user.role === USER_ROLE.OWNER) {
    const rows = await prisma.event.findMany({
      where: { ownerId: user.id, status: "LIVE" },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  const ownerId = getOwnerId(user);

  if (user.role === USER_ROLE.MAITRE_HOTEL) {
    const rows = await prisma.event.findMany({
      where: { ownerId, status: "LIVE" },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  const rows = await prisma.event.findMany({
    where: {
      ownerId,
      status: "LIVE",
      staffAccess: { some: { userId: user.id } },
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function requireSessionUser(): Promise<SessionUser> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Non authentifié");
  const user = await getSessionUser(userId);
  if (!user) throw new Error("Non authentifié");
  return user;
}

export function isOwner(user: SessionUser): boolean {
  return user.role === USER_ROLE.OWNER;
}

export function isMaitreHotel(user: SessionUser): boolean {
  return user.role === USER_ROLE.MAITRE_HOTEL;
}

/** Opérations événement (menu, tables, allergies, accessoires, consignes). */
export function canManageEventOps(user: SessionUser): boolean {
  return (
    user.role === USER_ROLE.OWNER || user.role === USER_ROLE.MAITRE_HOTEL
  );
}

export function canClaimGuestRequests(user: SessionUser): boolean {
  return (
    user.role === USER_ROLE.OWNER ||
    user.role === USER_ROLE.MAITRE_HOTEL ||
    user.role === USER_ROLE.STAFF
  );
}

export function canUnclaimGuestRequest(
  user: SessionUser,
  claimedById: string | null,
): boolean {
  if (!claimedById) return false;
  if (claimedById === user.id) return true;
  return (
    user.role === USER_ROLE.OWNER || user.role === USER_ROLE.MAITRE_HOTEL
  );
}
