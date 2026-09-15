import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  EVENT_STATUS,
  GUEST_REQUEST_STATUS,
  USER_ROLE,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = req.headers.get("authorization")?.trim();
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length).trim();
  if (!token) return false;

  return timingSafeEqualString(token, secret);
}

async function escalateAssigneeId(ownerId: string): Promise<string> {
  const mh = await prisma.user.findFirst({
    where: { employerId: ownerId, role: USER_ROLE.MAITRE_HOTEL },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return mh?.id ?? ownerId;
}

export async function POST(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const candidates = await prisma.guestRequest.findMany({
    where: {
      event: { status: EVENT_STATUS.LIVE },
      OR: [
        { status: GUEST_REQUEST_STATUS.PENDING },
        {
          status: GUEST_REQUEST_STATUS.IN_PROGRESS,
          claimedById: { not: null },
        },
      ],
    },
    include: {
      event: {
        select: {
          id: true,
          ownerId: true,
          escaladeDelayMinutes: true,
        },
      },
    },
    take: 500,
    orderBy: { createdAt: "asc" },
  });

  const due = candidates.filter((r) => {
    const delayMs = Math.max(0, r.event.escaladeDelayMinutes) * 60_000;
    return r.createdAt.getTime() <= now.getTime() - delayMs;
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
      where: {
        id: reqRow.id,
        status: {
          in: [
            GUEST_REQUEST_STATUS.PENDING,
            GUEST_REQUEST_STATUS.IN_PROGRESS,
          ],
        },
      },
      data: {
        claimedById: assigneeId,
        claimedAt: now,
        status: GUEST_REQUEST_STATUS.ESCALATED,
      },
    });
    escalated += result.count;
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates.length,
    due: due.length,
    escalated,
  });
}
