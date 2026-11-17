import {
  EVENT_STATUS,
  GUEST_REQUEST_STATUS,
  USER_ROLE,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";

async function escalateAssigneeId(ownerId: string): Promise<string> {
  const mh = await prisma.user.findFirst({
    where: { employerId: ownerId, role: USER_ROLE.MAITRE_HOTEL },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return mh?.id ?? ownerId;
}

/**
 * Escalade les demandes restées sans suite trop longtemps :
 * - en attente : depuis la création ;
 * - prises en charge : depuis la prise en charge (claimedAt).
 *
 * Appelée par le cron et à chaque rafraîchissement du tableau de bord d'un
 * événement : l'escalade fonctionne même sans cron (plan Vercel gratuit).
 */
export async function escalateDueRequests(eventId?: string) {
  const now = new Date();
  const candidates = await prisma.guestRequest.findMany({
    where: {
      ...(eventId ? { eventId } : {}),
      event: { status: EVENT_STATUS.LIVE },
      OR: [
        { status: GUEST_REQUEST_STATUS.PENDING },
        {
          status: GUEST_REQUEST_STATUS.IN_PROGRESS,
          claimedById: { not: null },
        },
      ],
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      claimedAt: true,
      event: { select: { ownerId: true, escaladeDelayMinutes: true } },
    },
    take: 500,
    orderBy: { createdAt: "asc" },
  });

  const due = candidates.filter((r) => {
    const delayMs = Math.max(0, r.event.escaladeDelayMinutes) * 60_000;
    const since =
      r.status === GUEST_REQUEST_STATUS.IN_PROGRESS && r.claimedAt
        ? r.claimedAt
        : r.createdAt;
    return since.getTime() <= now.getTime() - delayMs;
  });

  const assigneeCache = new Map<string, string>();
  let escalated = 0;

  for (const reqRow of due) {
    let assigneeId = assigneeCache.get(reqRow.event.ownerId);
    if (!assigneeId) {
      assigneeId = await escalateAssigneeId(reqRow.event.ownerId);
      assigneeCache.set(reqRow.event.ownerId, assigneeId);
    }

    const result = await prisma.guestRequest.updateMany({
      where: { id: reqRow.id, status: reqRow.status },
      data: {
        claimedById: assigneeId,
        claimedAt: now,
        status: GUEST_REQUEST_STATUS.ESCALATED,
      },
    });
    escalated += result.count;
  }

  return { scanned: candidates.length, due: due.length, escalated };
}
