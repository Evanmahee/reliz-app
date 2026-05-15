import Link from "next/link";
import { createChecklistAction } from "@/app/actions/checklists";
import { Button, outlineButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function NouvelleChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <Link href="/dashboard/checklists" className={outlineButtonClassName}>
          ← Checklists
        </Link>
        <p className="mt-5 text-xs font-medium text-zinc-400">Nouveau</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Nouvelle checklist
        </h1>
        {sp.erreur === "nom" ? (
          <p className="mt-2 text-sm text-red-600">Le nom est obligatoire.</p>
        ) : null}
      </div>

      <Card className="px-5 py-6 sm:px-6 sm:py-8">
        <form action={createChecklistAction} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Nom de la checklist *
            </label>
            <Input
              name="name"
              required
              placeholder="Ex. Réception salle A — standard"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Après création, vous pourrez ajouter blocs de texte et cases à cocher.
          </p>
          <Button type="submit" className="w-full">
            Créer et éditer
          </Button>
        </form>
      </Card>
    </div>
  );
}
