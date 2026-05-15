import Link from "next/link";
import { redirect } from "next/navigation";
import { createEventAction } from "@/app/actions/events";
import { Button, outlineButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const selectClassName =
  "flex h-11 w-full rounded-[1rem] border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-offset-white focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10";

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
        {sp.erreur === "nom" ? (
          <p className="mt-2 text-sm text-red-600">Le nom est obligatoire.</p>
        ) : null}
      </div>

      <Card className="px-5 py-6 sm:px-6 sm:py-8">
        <form action={createEventAction} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Nom de l’événement *
            </label>
            <Input name="name" required placeholder="Mariage Camille & Sam" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Lieu
            </label>
            <Input name="venue" placeholder="Domaine des Acacias" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Date & heure de début
            </label>
            <Input name="startsAt" type="datetime-local" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Checklist consignes
            </label>
            <select name="checklistId" className={selectClassName} defaultValue="">
              <option value="">
                — Aucune (consignes vides, à compléter sur la fiche) —
              </option>
              {checklists.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-zinc-500">
              Les modèles sont gérés dans{" "}
              <Link
                href="/dashboard/checklists"
                className="font-medium text-zinc-800 underline"
              >
                Checklists
              </Link>
              . Le contenu est copié dans l’événement : vous pourrez le modifier
              ensuite dans l’onglet Consignes.
            </p>
          </div>
          <Button type="submit" className="w-full">
            Créer et ouvrir la fiche
          </Button>
        </form>
      </Card>
    </div>
  );
}
