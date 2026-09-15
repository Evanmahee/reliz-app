import JSZip from "jszip";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import {
  assertEventAccess,
  canManageEventOps,
  getSessionUser,
} from "@/lib/event-access";
import {
  clampLabelMm,
  qrPixelSize,
  type QrLabelSize,
} from "@/lib/qr-label-size";
import { buildTableGuestUrl, sortTablesByNumber } from "@/lib/table-guest-url";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Non authentifié", { status: 401 });
  }
  const user = await getSessionUser(userId);
  if (!user) {
    return new Response("Non authentifié", { status: 401 });
  }
  if (!canManageEventOps(user)) {
    return new Response("Interdit", { status: 403 });
  }
  try {
    await assertEventAccess(id, user);
  } catch {
    return new Response("Introuvable", { status: 404 });
  }

  const event = await prisma.event.findFirst({
    where: { id },
    select: { publicSlug: true, name: true },
  });
  if (!event) {
    return new Response("Introuvable", { status: 404 });
  }

  const tables = sortTablesByNumber(
    await prisma.table.findMany({ where: { eventId: id } }),
  );
  if (tables.length === 0) {
    return NextResponse.json(
      { error: "Aucune table définie" },
      { status: 400 },
    );
  }

  const sp = new URL(req.url).searchParams;
  const size: QrLabelSize = {
    widthMm: clampLabelMm(Number(sp.get("widthMm") ?? 50), 50),
    heightMm: clampLabelMm(Number(sp.get("heightMm") ?? 50), 50),
  };
  const pngWidth = qrPixelSize(size, 96);

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const zip = new JSZip();
  for (const table of tables) {
    const url = buildTableGuestUrl(
      base,
      event.publicSlug,
      table.number,
      table.zone,
    );
    const png = await QRCode.toBuffer(url, {
      type: "png",
      width: pngWidth,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0a0a0a", light: "#ffffff" },
    });
    const safeName = table.number.replace(/[/\\?%*:|"<>]/g, "-");
    zip.file(`table-${safeName}.png`, png);
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const slugSafe = event.publicSlug.replace(/[/\\?%*:|"<>]/g, "-");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="qr-tables-${slugSafe}-${size.widthMm}x${size.heightMm}mm.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
