"use client";

import { createChecklistAction } from "@/app/actions/checklists";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateChecklistForm({ showNameError }: { showNameError: boolean }) {
  return (
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
        {showNameError ? (
          <p className="text-sm text-red-600">Le nom est obligatoire.</p>
        ) : null}
        <p className="text-xs text-zinc-500">
          Après création, vous pourrez ajouter blocs de texte et cases à cocher.
        </p>
        <SubmitButton className="w-full" pendingLabel="Création…">
          Créer et éditer
        </SubmitButton>
      </form>
    </Card>
  );
}
