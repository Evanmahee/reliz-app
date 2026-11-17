import { headers } from "next/headers";

/** IP du visiteur dans une Server Action / page (Vercel renseigne x-forwarded-for). */
export async function requestIp(): Promise<string> {
  const h = await headers();
  const xf = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return xf || h.get("x-real-ip")?.trim() || "unknown";
}
