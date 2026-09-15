import { NextResponse } from "next/server";
import { GUEST_REQUEST_STATUS } from "@/lib/constants";
import {
  assertEventAccess,
  canUnclaimGuestRequest,
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
  if (!user) {
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

  if (!canUnclaimGuestRequest(user, request.claimedById)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const row = await prisma.guestRequest.update({
    where: { id },
    data: {
      claimedById: null,
      claimedAt: null,
      status: GUEST_REQUEST_STATUS.PENDING,
    },
    include: {
      claimedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(row);
}
