import { NextResponse } from "next/server";
import { GUEST_REQUEST_STATUS } from "@/lib/constants";
import { DEMO_SLUG } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

/**
 * Vue équipe de la démo (lecture seule, sans données personnelles).
 * À chaque lecture, un « serveur virtuel » fait avancer les demandes :
 * prise en charge après 12 s, traitée après 40 s. Ménage après 30 min.
 */
export async function GET(req: Request) {
  const limited = checkRateLimit({
    key: `demo-board:${clientIpFromRequest(req)}`,
    limit: 40,
    windowMs: 60_000,
  });
  if (!limited.ok) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const event = await prisma.event.findUnique({
    where: { publicSlug: DEMO_SLUG },
    select: { id: true, name: true, status: true },
  });
  if (!event || event.status !== "LIVE") {
    return NextResponse.json({ error: "Démo indisponible" }, { status: 404 });
  }

  const now = Date.now();
  await Promise.all([
    prisma.guestRequest.updateMany({
      where: {
        eventId: event.id,
        status: { in: [GUEST_REQUEST_STATUS.PENDING, GUEST_REQUEST_STATUS.ESCALATED] },
        createdAt: { lt: new Date(now - 12_000) },
      },
      data: { status: GUEST_REQUEST_STATUS.IN_PROGRESS, claimedAt: new Date(now) },
    }),
    prisma.guestRequest.updateMany({
      where: {
        eventId: event.id,
        status: GUEST_REQUEST_STATUS.IN_PROGRESS,
        createdAt: { lt: new Date(now - 40_000) },
      },
      data: { status: GUEST_REQUEST_STATUS.DONE },
    }),
    prisma.guestRequest.deleteMany({
      where: { eventId: event.id, createdAt: { lt: new Date(now - 30 * 60_000) } },
    }),
    prisma.guestAllergy.deleteMany({ where: { eventId: event.id } }).then(() => null),
  ]);

  const rows = await prisma.guestRequest.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      tableNumber: true,
      tableLocation: true,
      category: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });
  return NextResponse.json(
    { eventName: event.name, requests: rows },
    { headers: { "Cache-Control": "no-store" } },
  );
}
