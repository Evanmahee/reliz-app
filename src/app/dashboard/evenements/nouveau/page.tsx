import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateEventForm } from "@/components/dashboard/create-event-form";
import { outlineButtonClassName } from "@/components/ui/button";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NouvelEvenementPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const checklists = await prisma.checklist.findMany({
    where: { ownerId: userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <Link
          href="/dashboard/evenements"
          className={outlineButtonClassName}
        >
          ← Retour aux événements
        </Link>
        <p className="mt-5 text-xs font-medium text-zinc-400">Nouveau</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Créer un événement
        </h1>
      </div>

      <CreateEventForm
        checklists={checklists}
        showNameError={sp.erreur === "nom"}
      />
    </div>
  );
}
