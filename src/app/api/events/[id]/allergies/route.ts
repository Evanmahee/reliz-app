import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import {
  assertEventAccess,
  canManageEventOps,
  getSessionUser,
} from "@/lib/event-access";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return getSessionUser(userId);
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  try {
    await assertEventAccess(id, user);
  } catch {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const table = new URL(req.url).searchParams.get("table")?.trim() ?? "";
  const allergies = await prisma.guestAllergy.findMany({
    where: {
      eventId: id,
      ...(table ? { tableNumber: table } : {}),
    },
    orderBy: { tableNumber: "asc" },
  });
  return NextResponse.json(allergies);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canManageEventOps(user)) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }
  try {
    await assertEventAccess(id, user);
  } catch {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const tableNumber = String(body.tableNumber ?? "").trim();
  const content = String(body.content ?? "").trim();
  if (!tableNumber) {
    return NextResponse.json({ error: "tableNumber requis" }, { status: 400 });
  }

  // Contenu vide = effacer les allergies de la table.
  if (!content) {
    await prisma.guestAllergy.deleteMany({
      where: { eventId: id, tableNumber },
    });
    return NextResponse.json({ ok: true, cleared: true });
  }

  // Remplace les entrées existantes de la table par une seule note admin.
  await prisma.guestAllergy.deleteMany({
    where: { eventId: id, tableNumber },
  });
  const row = await prisma.guestAllergy.create({
    data: { eventId: id, tableNumber, content },
  });
  return NextResponse.json(row, { status: 201 });
}
