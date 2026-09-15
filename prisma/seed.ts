/**
 * Seed : crée un user Auth (si SERVICE_ROLE) + profil public."User".
 * Préférer créer le compte dans Supabase → Authentication, puis se connecter
 * (le profil est créé automatiquement au login).
 */
import "dotenv/config";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

if (existsSync(resolve(process.cwd(), ".env.local"))) {
  config({ path: ".env.local" });
}

const prisma = new PrismaClient();

async function main() {
  const email = "demo@reliz.app";
  const password = "demo1234";
  const name = "Démo Traiteur";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.log(
      "Seed Auth sauté : ajoute SUPABASE_SERVICE_ROLE_KEY dans .env.local",
    );
    console.log(
      "→ Crée plutôt l’utilisateur dans Supabase Authentication, puis connecte-toi.",
    );
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list.data.users.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    user = data.user;
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: { email, name, role: "OWNER" },
    create: { id: user.id, email, name, role: "OWNER" },
  });

  console.log("Seed OK — compte:", email, "/", password);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
