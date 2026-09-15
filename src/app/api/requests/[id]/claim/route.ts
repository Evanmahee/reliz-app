import { NextResponse } from "next/server";
import { GUEST_REQUEST_STATUS } from "@/lib/constants";
import {
  assertEventAccess,
  canClaimGuestRequests,
  getSessionUser,
} from "@/lib/event-access";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const user = await getSessionUser(userId);
  if (!user || !canClaimGuestRequests(user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const request = await prisma.guestRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  try {
    await assertEventAccess(request.eventId, user);
  } catch {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (request.status === GUEST_REQUEST_STATUS.DONE) {
    return NextResponse.json(
      { error: "Demande déjà traitée" },
      { status: 409 },
    );
  }

  const isEscalated = request.status === GUEST_REQUEST_STATUS.ESCALATED;

  if (
    !isEscalated &&
    request.claimedById &&
    request.claimedById !== user.id
  ) {
    return NextResponse.json(
      { error: "Déjà prise en charge" },
      { status: 409 },
    );
  }

  const updated = await prisma.guestRequest.updateMany({
    where: isEscalated
      ? { id, status: GUEST_REQUEST_STATUS.ESCALATED }
      : {
          id,
          OR: [{ claimedById: null }, { claimedById: user.id }],
          status: {
            in: [
              GUEST_REQUEST_STATUS.PENDING,
              GUEST_REQUEST_STATUS.IN_PROGRESS,
            ],
          },
        },
    data: {
      claimedById: user.id,
      claimedAt: new Date(),
      status: GUEST_REQUEST_STATUS.IN_PROGRESS,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      { error: "Déjà prise en charge" },
      { status: 409 },
    );
  }

  const row = await prisma.guestRequest.findUnique({
    where: { id },
    include: {
      claimedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(row);
}
