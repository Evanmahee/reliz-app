import type { NextConfig } from "next";

/** Évite les blocages Server Actions quand Origin et Host diffèrent (localhost vs 127.0.0.1, port…). */
function addCrossLoopbackVariants(origins: Set<string>, port: string) {
  origins.add(`localhost:${port}`);
  origins.add(`127.0.0.1:${port}`);
  origins.add(`[::1]:${port}`);
}

function isLoopbackOrLanHostname(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h.endsWith(".local") ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(h) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h)
  );
}

/**
 * Si Origin ≠ Host (proxy, www vs apex…), Next.js bloque les Server Actions (connexion, formulaires).
 * En dev (`next dev`) et en prod locale (`next start` + URL dans .env), on autorise les combinaisons courantes.
 */
function buildServerActionAllowedOrigins(): string[] {
  const origins = new Set<string>(["*.vercel.app"]);

  const extra = process.env.SERVER_ACTIONS_ALLOWED_ORIGINS?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const o = part.trim().toLowerCase();
      if (o) origins.add(o);
    }
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    const host = vercelHost.replace(/^https?:\/\//i, "").split("/")[0]?.toLowerCase();
    if (host) origins.add(host);
  }

  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (pub.startsWith("http://") || pub.startsWith("https://")) {
    try {
      const u = new URL(pub);
      const hostOnly = u.hostname.toLowerCase();
      origins.add(u.host.toLowerCase());

      const port = u.port || (hostOnly === "localhost" || hostOnly === "127.0.0.1" ? "3000" : "");
      if (port && isLoopbackOrLanHostname(hostOnly)) {
        addCrossLoopbackVariants(origins, port);
      }

      if (!isLoopbackOrLanHostname(hostOnly)) {
        origins.add(hostOnly);
        if (hostOnly.startsWith("www.")) origins.add(hostOnly.slice(4));
        else origins.add(`www.${hostOnly}`);
      }
    } catch {
      /* ignore URL invalide */
    }
  }

  if (process.env.NODE_ENV === "development") {
    addCrossLoopbackVariants(origins, String(process.env.PORT ?? "3000"));
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  /** Hot reload / assets dev depuis un hostname type traiteur.local */
  allowedDevOrigins: ["*.local"],
  experimental: {
    serverActions: {
      allowedOrigins: buildServerActionAllowedOrigins(),
    },
  },
};

export default nextConfig;
