import "dotenv/config";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../src/lib/prisma";

const prisma = createPrismaClient();

async function main() {
  const email = "demo@reliz.app";
  const password = "demo1234";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: "Démo Traiteur" },
    create: {
      email,
      name: "Démo Traiteur",
      passwordHash,
    },
  });

  console.log("Seed OK — compte démo:", email, "/", password);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
