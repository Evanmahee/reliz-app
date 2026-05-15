import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = token ? await verifySessionToken(token) : null;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const event = await prisma.event.findFirst({
    where: { id, ownerId: userId },
    select: { id: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const requests = await prisma.guestRequest.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "desc" },
    take: 120,
  });
  return NextResponse.json(requests);
}
