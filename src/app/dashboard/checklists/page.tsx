import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, outlineButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ChecklistsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const checklists = await prisma.checklist.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400">Modèles</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Checklists
          </h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-500">
            Enregistrez textes et cases à cocher réutilisables. À la création d’un
            événement, choisissez une checklist pour préremplir l’onglet Consignes.
          </p>
        </div>
        <Link href="/dashboard/checklists/nouveau">
          <Button>Nouvelle checklist</Button>
        </Link>
      </div>

      <Card className="divide-y divide-zinc-100 overflow-hidden rounded-[1.35rem] border-zinc-200">
        {checklists.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            <p>Aucune checklist pour le moment.</p>
            <Link
              href="/dashboard/checklists/nouveau"
              className={`mt-4 inline-block ${outlineButtonClassName}`}
            >
              Créer une checklist
            </Link>
          </div>
        ) : (
          checklists.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboard/checklists/${c.id}`}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  {c.name}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Mis à jour{" "}
                  {c.updatedAt.toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/dashboard/checklists/${c.id}`}>
                  <Button variant="outline" className="text-xs">
                    Modifier
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
