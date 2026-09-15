import { NextResponse } from "next/server";
import {
  EVENT_STATUS,
  GUEST_REQUEST,
  REQUEST_CATEGORY,
} from "@/lib/constants";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;

const ALLOWED_TYPES = new Set<string>(Object.values(GUEST_REQUEST));
const ALLOWED_CATEGORIES = new Set<string>(Object.values(REQUEST_CATEGORY));
const TABLE_NUMBER_RE = /^[a-zA-Z0-9\- ]{1,20}$/;

const RATE_LIMIT_MESSAGES = {
  fr: "Trop de demandes. Réessayez dans une minute.",
  en: "Too many requests. Please try again in a minute.",
  es: "Demasiadas solicitudes. Inténtalo de nuevo en un minuto.",
  de: "Zu viele Anfragen. Bitte in einer Minute erneut versuchen.",
} as const;

function localeFromRequest(req: Request): keyof typeof RATE_LIMIT_MESSAGES {
  const cookie = req.headers.get("cookie") ?? "";
  const m = /(?:^|;\s*)reliz_lang=(fr|en|es|de)/.exec(cookie);
  if (m?.[1]) return m[1] as keyof typeof RATE_LIMIT_MESSAGES;
  const accept = req.headers.get("accept-language")?.toLowerCase() ?? "";
  if (accept.startsWith("fr")) return "fr";
  if (accept.startsWith("en")) return "en";
  if (accept.startsWith("es")) return "es";
  if (accept.startsWith("de")) return "de";
  return "fr";
}

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
  if (!publicSlug) {
    return NextResponse.json({ error: "publicSlug requis" }, { status: 400 });
  }

  const ip = clientIpFromRequest(req);
  const limited = checkRateLimit({
    key: `requests:${ip}:${publicSlug}`,
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS,
  });
  if (!limited.ok) {
    const loc = localeFromRequest(req);
    return NextResponse.json(
      {
        error: RATE_LIMIT_MESSAGES[loc],
        messages: RATE_LIMIT_MESSAGES,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const tableNumber = String(body.tableNumber ?? "").trim();
  const message = String(body.message ?? "").trim();
  const tableLocation = String(body.tableLocation ?? "").trim();
  const allergies = String(body.allergies ?? "").trim();
  const typeRaw = String(body.type ?? GUEST_REQUEST.SERVICE).trim();
  const type = typeRaw || GUEST_REQUEST.SERVICE;

  if (!tableNumber || tableNumber.length > 20 || !TABLE_NUMBER_RE.test(tableNumber)) {
    return NextResponse.json(
      {
        error:
          "tableNumber invalide (max 20, alphanumérique, tiret ou espace)",
      },
      { status: 400 },
    );
  }
  if (!message) {
    return NextResponse.json({ error: "message requis" }, { status: 400 });
  }
  if (message.length > 1000) {
    return NextResponse.json(
      { error: "message trop long (max 1000)" },
      { status: 400 },
    );
  }
  if (allergies.length > 500) {
    return NextResponse.json(
      { error: "allergies trop long (max 500)" },
      { status: 400 },
    );
  }
  if (tableLocation.length > 100) {
    return NextResponse.json(
      { error: "tableLocation trop long (max 100)" },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: "type invalide (PRODUCT | SERVICE | STAFF)" },
      { status: 400 },
    );
  }

  let category: string;
  if (body.category !== undefined && body.category !== null && String(body.category).trim() !== "") {
    category = String(body.category).trim().toUpperCase();
    if (!ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json(
        {
          error:
            "category invalide (DRINK | CLEAR | ASSISTANCE | URGENT | MISC | OTHER)",
        },
        { status: 400 },
      );
    }
  } else {
    category =
      type === GUEST_REQUEST.STAFF
        ? REQUEST_CATEGORY.ASSISTANCE
        : type === GUEST_REQUEST.PRODUCT
          ? REQUEST_CATEGORY.OTHER
          : REQUEST_CATEGORY.MISC;
  }

  const event = await prisma.event.findUnique({
    where: { publicSlug },
    select: { id: true, status: true },
  });
  if (!event || event.status !== EVENT_STATUS.LIVE) {
    return NextResponse.json({ error: "Événement indisponible" }, { status: 404 });
  }

  const tableRow = await prisma.table.findFirst({
    where: { eventId: event.id, number: tableNumber },
    select: { isVip: true, zone: true },
  });
  const resolvedLocation =
    tableLocation || (tableRow?.zone ? tableRow.zone : "");

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
