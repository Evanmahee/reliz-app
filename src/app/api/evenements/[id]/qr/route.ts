import { cookies } from "next/headers";
import QRCode from "qrcode";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = token ? await verifySessionToken(token) : null;
  if (!userId) {
    return new Response("Non authentifié", { status: 401 });
  }
  const event = await prisma.event.findFirst({
    where: { id, ownerId: userId },
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
