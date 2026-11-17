import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { escalateDueRequests } from "@/lib/escalation";

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = req.headers.get("authorization")?.trim();
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length).trim();
  if (!token) return false;

  return timingSafeEqualString(token, secret);
}

export async function POST(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Une requête en base par jour suffit aussi à empêcher la mise en pause
  // du projet Supabase gratuit (pause après 7 jours sans activité).
  const result = await escalateDueRequests();
  return NextResponse.json({ ok: true, ...result });
}

/** Vercel Cron appelle la route en GET (avec Authorization: Bearer CRON_SECRET). */
export const GET = POST;
