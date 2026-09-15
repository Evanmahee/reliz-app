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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; tableId: string }> },
) {
  const { id, tableId } = await ctx.params;
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

  const existing = await prisma.table.findFirst({
    where: { id: tableId, eventId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const data: { number?: string; zone?: string; isVip?: boolean } = {};
  if (body.number !== undefined) {
    const number = String(body.number).trim();
    if (!number) {
      return NextResponse.json({ error: "number invalide" }, { status: 400 });
    }
    data.number = number;
  }
  if (body.zone !== undefined) {
    data.zone = String(body.zone).trim();
  }
  if (body.isVip !== undefined) {
    data.isVip = Boolean(body.isVip);
  }

  try {
    const table = await prisma.table.update({
      where: { id: tableId },
      data,
    });
    return NextResponse.json(table);
  } catch {
    return NextResponse.json(
      { error: "Conflit (numéro déjà utilisé)" },
      { status: 409 },
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; tableId: string }> },
) {
  const { id, tableId } = await ctx.params;
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

  const existing = await prisma.table.findFirst({
    where: { id: tableId, eventId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.table.delete({ where: { id: tableId } });
  return NextResponse.json({ ok: true });
}
