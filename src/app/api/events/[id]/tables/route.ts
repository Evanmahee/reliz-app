import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import {
  assertEventAccess,
  canManageEventOps,
  getSessionUser,
} from "@/lib/event-access";
import { sortTablesByNumber } from "@/lib/table-guest-url";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return getSessionUser(userId);
}

export async function GET(
  _req: Request,
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

  const tables = await prisma.table.findMany({ where: { eventId: id } });
  return NextResponse.json(sortTablesByNumber(tables));
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

  const zone = String(body.zone ?? "").trim();
  const isVip = Boolean(body.isVip);

  const bulkTo = Number(body.bulkTo ?? body.to);
  const bulkFrom = Number(body.bulkFrom ?? body.from ?? 1);

  if (Number.isFinite(bulkTo) && bulkTo >= 1) {
    const from = Number.isFinite(bulkFrom) && bulkFrom >= 1 ? bulkFrom : 1;
    const to = Math.floor(bulkTo);
    const start = Math.floor(from);
    if (to < start || to - start > 500) {
      return NextResponse.json(
        { error: "Plage invalide (max 500 tables)" },
        { status: 400 },
      );
    }

    const existing = await prisma.table.findMany({
      where: { eventId: id },
      select: { number: true },
    });
    const existingSet = new Set(existing.map((t) => t.number));
    const toCreate: {
      eventId: string;
      number: string;
      zone: string;
      isVip: boolean;
    }[] = [];
    for (let n = start; n <= to; n++) {
      const number = String(n);
      if (existingSet.has(number)) continue;
      toCreate.push({ eventId: id, number, zone, isVip });
    }

    if (toCreate.length > 0) {
      await prisma.table.createMany({ data: toCreate });
    }

    const tables = await prisma.table.findMany({ where: { eventId: id } });
    return NextResponse.json(
      {
        created: toCreate.length,
        skipped: to - start + 1 - toCreate.length,
        tables: sortTablesByNumber(tables),
      },
      { status: 201 },
    );
  }

  const number = String(body.number ?? "").trim();
  if (!number) {
    return NextResponse.json({ error: "number requis" }, { status: 400 });
  }

  try {
    const table = await prisma.table.create({
      data: { eventId: id, number, zone, isVip },
    });
    return NextResponse.json(table, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Table déjà existante ou invalide" },
      { status: 409 },
    );
  }
}
