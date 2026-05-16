"use client";

import Link from "next/link";
import { createEventAction } from "@/app/actions/events";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const selectClassName =
  "flex h-11 w-full rounded-[1rem] border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-offset-white focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10";

export function CreateEventForm({
  checklists,
  showNameError,
}: {
  checklists: { id: string; name: string }[];
  showNameError: boolean;
}) {
  return (
    <Card className="px-5 py-6 sm:px-6 sm:py-8">
      <form action={createEventAction} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            Nom de l’événement *
          </label>
          <Input name="name" required placeholder="Mariage Camille & Sam" />
        </div>
        {showNameError ? (
          <p className="text-sm text-red-600">Le nom est obligatoire.</p>
        ) : null}
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
        <SubmitButton className="w-full" pendingLabel="Création…">
          Créer et ouvrir la fiche
        </SubmitButton>
      </form>
    </Card>
  );
}
