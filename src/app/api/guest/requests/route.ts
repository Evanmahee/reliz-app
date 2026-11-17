import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

const ID_RE = /^[a-zA-Z0-9_-]{12,36}$/;

/**
 * Suivi des demandes par l'invité : uniquement les identifiants générés par
 * son téléphone (non devinables), et seulement pour cet événement.
 * GET ?slug=…&ids=a,b,c (20 max).
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const slug = sp.get("slug")?.trim() ?? "";
  const ids = (sp.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => ID_RE.test(s))
    .slice(0, 20);
  if (!slug || slug.length > 40 || ids.length === 0) return NextResponse.json([]);
  const limited = checkRateLimit({
    key: `guest-status:${clientIpFromRequest(req)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) return NextResponse.json([], { status: 429 });

  const rows = await prisma.guestRequest.findMany({
    where: { id: { in: ids }, event: { publicSlug: slug } },
    select: { id: true, status: true },
  });
  return NextResponse.json(rows, {
    headers: { "Cache-Control": "no-store" },
  });
}
