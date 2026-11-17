import { NextResponse } from "next/server";
import { EVENT_STATUS } from "@/lib/constants";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const TABLE_NUMBER_RE = /^[a-zA-Z0-9\- ]{1,20}$/;
const MAX_NOTES_PER_TABLE = 10;

/**
 * Allergies / intolérances déclarées par un invité, sans passer de demande.
 * Body JSON : publicSlug, tableNumber, allergies.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const publicSlug = String(body.publicSlug ?? "").trim();
  const tableNumber = String(body.tableNumber ?? "").trim();
  const allergies = String(body.allergies ?? "").trim();
  if (!publicSlug || !TABLE_NUMBER_RE.test(tableNumber)) {
    return NextResponse.json({ error: "Table invalide" }, { status: 400 });
  }
  if (!allergies || allergies.length > 500) {
    return NextResponse.json({ error: "Texte invalide (max 500)" }, { status: 400 });
  }

  const limited = checkRateLimit({
    key: `allergies:${clientIpFromRequest(req)}:${publicSlug}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives, réessayez dans une minute." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const event = await prisma.event.findUnique({
    where: { publicSlug },
    select: { id: true, status: true },
  });
  if (!event || event.status !== EVENT_STATUS.LIVE) {
    return NextResponse.json({ error: "Événement indisponible" }, { status: 404 });
  }
  const [tableRow, tableCount, notes] = await Promise.all([
    prisma.table.findFirst({
      where: { eventId: event.id, number: tableNumber },
      select: { id: true },
    }),
    prisma.table.count({ where: { eventId: event.id } }),
    prisma.guestAllergy.count({ where: { eventId: event.id, tableNumber } }),
  ]);
  if (tableCount > 0 && !tableRow) {
    return NextResponse.json({ error: "Table inconnue pour cet événement" }, { status: 400 });
  }
  if (notes >= MAX_NOTES_PER_TABLE) {
    return NextResponse.json(
      { error: "Trop de notes pour cette table : prévenez le personnel." },
      { status: 429 },
    );
  }

  await prisma.guestAllergy.create({
    data: { eventId: event.id, tableNumber, content: allergies },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
