import QRCode from "qrcode";
import { getSessionUserId } from "@/lib/auth";
import {
  assertEventAccess,
  canManageEventOps,
  getSessionUser,
} from "@/lib/event-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Non authentifié", { status: 401 });
  }
  const user = await getSessionUser(userId);
  if (!user || !canManageEventOps(user)) {
    return new Response("Non authentifié", { status: 401 });
  }
  try {
    await assertEventAccess(id, user);
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
  const event = await prisma.event.findFirst({
    where: { id },
    select: { publicSlug: true },
  });
  if (!event) {
    return new Response("Introuvable", { status: 404 });
  }
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const url = `${base}/e/${event.publicSlug}`;
  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 640,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${event.publicSlug}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
