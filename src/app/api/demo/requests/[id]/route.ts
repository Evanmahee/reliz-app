import { NextResponse } from "next/server";
import { GUEST_REQUEST_STATUS } from "@/lib/constants";
import { DEMO_SLUG } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

/**
 * Démo du site : le visiteur prend en charge ou traite une demande,
 * uniquement sur l'événement de démonstration.
 * Body JSON : { action: "claim" | "done" }
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-zA-Z0-9_-]{8,40}$/.test(id)) {
    return NextResponse.json({ error: "Demande inconnue" }, { status: 404 });
  }
  const limited = checkRateLimit({
    key: `demo-action:${clientIpFromRequest(req)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  let action = "";
  try {
    action = String(((await req.json()) as { action?: unknown }).action ?? "");
  } catch {
    /* corps invalide */
  }
  if (action !== "claim" && action !== "done") {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  const result = await prisma.guestRequest.updateMany({
    where: {
      id,
      event: { publicSlug: DEMO_SLUG },
      status:
        action === "claim"
          ? { in: [GUEST_REQUEST_STATUS.PENDING, GUEST_REQUEST_STATUS.ESCALATED] }
          : { not: GUEST_REQUEST_STATUS.DONE },
    },
    data:
      action === "claim"
        ? { status: GUEST_REQUEST_STATUS.IN_PROGRESS, claimedAt: new Date() }
        : { status: GUEST_REQUEST_STATUS.DONE },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Déjà fait" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
