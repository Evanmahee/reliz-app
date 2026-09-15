import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { assertEventAccess, getSessionUser } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";

export async function GET(
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
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  try {
    await assertEventAccess(id, user);
  } catch {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const requests = await prisma.guestRequest.findMany({
    where: { eventId: id },
    include: {
      claimedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 120,
  });
  return NextResponse.json(requests);
}
