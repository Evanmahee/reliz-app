import type { NextConfig } from "next";

/**
 * Si Origin ≠ Host (proxy, www vs apex…), Next.js bloque les Server Actions (connexion, formulaires).
 * On autorise explicitement Vercel + l’URL publique du projet (+ variantes www).
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
      const host = new URL(pub).hostname.toLowerCase();
      const isLocal =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".local") ||
        /^192\.168\./.test(host) ||
        /^10\./.test(host);
      if (host && !isLocal) {
        origins.add(host);
        if (host.startsWith("www.")) origins.add(host.slice(4));
        else origins.add(`www.${host}`);
      }
    } catch {
      /* ignore URL invalide */
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: buildServerActionAllowedOrigins(),
    },
  },
};

export default nextConfig;
