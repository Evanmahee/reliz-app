import type { Event, User } from "@prisma/client";
import { getSessionUserId } from "@/lib/auth";
import { USER_ROLE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type SessionUser = Pick<User, "id" | "role" | "employerId" | "email" | "name">;

export function getOwnerId(user: SessionUser): string {
  return user.role === USER_ROLE.STAFF && user.employerId
    ? user.employerId
    : user.id;
}

export async function getSessionUser(userId: string): Promise<SessionUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, employerId: true, email: true, name: true },
  });
}

/** Événement appartenant au traiteur ou accessible au serveur assigné. */
export async function assertEventAccess(
  eventId: string,
  user: SessionUser,
): Promise<Event> {
  const ownerId = getOwnerId(user);
  if (user.role === USER_ROLE.OWNER) {
    const ev = await prisma.event.findFirst({
      where: { id: eventId, ownerId: user.id },
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

export async function listAccessibleLiveEventIds(user: SessionUser): Promise<string[]> {
  const ownerId = getOwnerId(user);
  if (user.role === USER_ROLE.OWNER) {
    const rows = await prisma.event.findMany({
      where: { ownerId: user.id, status: "LIVE" },
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
