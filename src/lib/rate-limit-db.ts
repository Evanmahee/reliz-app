import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export type RateRule = { key: string; limit: number; windowMs: number };

/**
 * Limiteur anti-abus partagé par toutes les instances (table RateLimitHit).
 * Chaque appel compte comme une tentative. Si la base ne répond pas ou que
 * la table n'existe pas encore, on retombe sur le limiteur en mémoire :
 * la protection est réduite, jamais absente.
 */
export async function hitRateLimit(
  rules: RateRule[],
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  try {
    const now = Date.now();
    for (const rule of rules) {
      const since = new Date(now - rule.windowMs);
      const count = await prisma.rateLimitHit.count({
        where: { key: rule.key, createdAt: { gte: since } },
      });
      if (count >= rule.limit) {
        return { ok: false, retryAfterSec: Math.ceil(rule.windowMs / 1000) };
      }
    }
    await prisma.rateLimitHit.createMany({
      data: rules.map((r) => ({ key: r.key })),
    });
    // Ménage occasionnel (≈ 1 appel sur 50) : on garde 24 h d'historique.
    if (Math.random() < 0.02) {
      void prisma.rateLimitHit
        .deleteMany({ where: { createdAt: { lt: new Date(now - 86_400_000) } } })
        .catch(() => {});
    }
    return { ok: true };
  } catch {
    for (const rule of rules) {
      const r = checkRateLimit(rule);
      if (!r.ok) return r;
    }
    return { ok: true };
  }
}

/** Efface les tentatives d'une clé (ex. connexion réussie). */
export async function clearRateLimit(key: string) {
  try {
    await prisma.rateLimitHit.deleteMany({ where: { key } });
  } catch {
    /* table absente : rien à effacer */
  }
}
