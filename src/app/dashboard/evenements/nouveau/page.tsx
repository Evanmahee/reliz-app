import Link from "next/link";
import { createEventAction } from "@/app/actions/events";
import { Button, outlineButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default async function NouvelEvenementPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <Link
          href="/dashboard/evenements"
          className={outlineButtonClassName}
        >
          ← Retour aux événements
        </Link>
        <p className="mt-5 text-xs font-medium text-zinc-400">
          Nouveau
        </p>
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
              Consignes équipe
            </label>
            <Textarea
              name="instructions"
              placeholder="Tenue, contacts sur place, timing du service…"
            />
          </div>
          <Button type="submit" className="w-full">
            Créer et ouvrir la fiche
          </Button>
        </form>
      </Card>
    </div>
  );
}
