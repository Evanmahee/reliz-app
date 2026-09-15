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
  ctx: { params: Promise<{ id: string; allergyId: string }> },
) {
  const { id, allergyId } = await ctx.params;
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

  const existing = await prisma.guestAllergy.findFirst({
    where: { id: allergyId, eventId: id },
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

  const data: { tableNumber?: string; content?: string } = {};
  if (body.tableNumber !== undefined) {
    const tableNumber = String(body.tableNumber).trim();
    if (!tableNumber) {
      return NextResponse.json(
        { error: "tableNumber invalide" },
        { status: 400 },
      );
    }
    data.tableNumber = tableNumber;
  }
  if (body.content !== undefined) {
    const content = String(body.content).trim();
    if (!content) {
      return NextResponse.json({ error: "content invalide" }, { status: 400 });
    }
    data.content = content;
  }

  const row = await prisma.guestAllergy.update({
    where: { id: allergyId },
    data,
  });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; allergyId: string }> },
) {
  const { id, allergyId } = await ctx.params;
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

  const existing = await prisma.guestAllergy.findFirst({
    where: { id: allergyId, eventId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.guestAllergy.delete({ where: { id: allergyId } });
  return NextResponse.json({ ok: true });
}
