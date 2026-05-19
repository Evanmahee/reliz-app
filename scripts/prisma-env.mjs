/**
 * Lance Prisma en chargeant d’abord .env.local (Supabase), puis .env en secours.
 * Usage : node scripts/prisma-env.mjs migrate deploy
 */
import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

if (existsSync(resolve(root, ".env.local"))) {
  config({ path: resolve(root, ".env.local") });
}
config({ path: resolve(root, ".env") });

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  console.error(
    [
      "DATABASE_URL invalide ou manquante pour PostgreSQL.",
      "",
      "→ Vérifiez .env.local : DATABASE_URL doit commencer par postgresql://",
      "  (Supabase : Connect → Session pooler → URI, port 5432)",
      "",
      "Puis relancez : npm run db:migrate",
      "",
      "Alternative sans CLI : exécutez prisma/supabase-staff-features.sql",
      "dans Supabase → SQL Editor.",
    ].join("\n"),
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const prismaArgs = args.length > 0 ? args : ["migrate", "deploy"];

const result = spawnSync("npx", ["prisma", ...prismaArgs], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
