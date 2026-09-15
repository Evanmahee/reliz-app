import { NextResponse } from "next/server";
import { EVENT_STATUS, GUEST_REQUEST, REQUEST_CATEGORY } from "@/lib/constants";
import { normalizeRequestCategory } from "@/lib/request-category";
import { prisma } from "@/lib/prisma";

/**
 * Création de demande invité (compat API).
 * Body JSON : publicSlug, tableNumber, message, type?, category?, tableLocation?, allergies?
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
  const message = String(body.message ?? "").trim();
  const tableLocation = String(body.tableLocation ?? "").trim();
  const type =
    String(body.type ?? GUEST_REQUEST.SERVICE).trim() || GUEST_REQUEST.SERVICE;

  if (!publicSlug) {
    return NextResponse.json({ error: "publicSlug requis" }, { status: 400 });
  }
  if (!tableNumber) {
    return NextResponse.json({ error: "tableNumber requis" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "message requis" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { publicSlug },
    select: { id: true, status: true },
  });
  if (!event || event.status !== EVENT_STATUS.LIVE) {
    return NextResponse.json({ error: "Événement indisponible" }, { status: 404 });
  }

  const category = normalizeRequestCategory(
    body.category ??
      (type === GUEST_REQUEST.STAFF
        ? REQUEST_CATEGORY.ASSISTANCE
        : type === GUEST_REQUEST.PRODUCT
          ? REQUEST_CATEGORY.OTHER
          : REQUEST_CATEGORY.MISC),
  );

  const tableRow = await prisma.table.findFirst({
    where: { eventId: event.id, number: tableNumber },
    select: { isVip: true, zone: true },
  });
  const resolvedLocation =
    tableLocation || (tableRow?.zone ? tableRow.zone : "");

  const allergies = String(body.allergies ?? "").trim();

  try {
    const row = await prisma.guestRequest.create({
      data: {
        eventId: event.id,
        tableNumber,
        tableLocation: resolvedLocation,
        type,
        category,
        message,
        isVip: tableRow?.isVip ?? false,
      },
    });

    if (allergies) {
      await prisma.guestAllergy.create({
        data: {
          eventId: event.id,
          tableNumber,
          content: allergies,
        },
      });
    }

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("[POST /api/requests]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
