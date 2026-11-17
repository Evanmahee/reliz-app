-- Compteur anti-abus partagé (additif, sans impact sur les données existantes).
CREATE TABLE IF NOT EXISTS "RateLimitHit" (
  "id" BIGSERIAL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "RateLimitHit_key_createdAt_idx" ON "RateLimitHit" ("key", "createdAt");
CREATE INDEX IF NOT EXISTS "RateLimitHit_createdAt_idx" ON "RateLimitHit" ("createdAt");
ALTER TABLE "RateLimitHit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "RateLimitHit" FROM anon, authenticated;
