import { headers } from "next/headers";

/**
 * URL publique de l'app (pour les liens et QR codes invités).
 * Ordre : NEXT_PUBLIC_APP_URL si valide → domaine de production Vercel →
 * hôte de la requête en cours. Ne renvoie jamais une chaîne vide
 * (un QR code « /e/… » sans domaine ne s'ouvre pas une fois scanné).
 */
export async function getAppBaseUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv && /^https?:\/\/[^/]+/i.test(fromEnv)) return fromEnv;

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return `https://${prod.replace(/^https?:\/\//i, "")}`;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}
