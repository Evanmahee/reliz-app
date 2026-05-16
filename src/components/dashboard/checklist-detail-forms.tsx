"use client";

import {
  deleteChecklistAction,
  updateChecklistNameAction,
} from "@/app/actions/checklists";
import { wrapFormActionWithToast } from "@/components/ui/form-action-toast";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ChecklistDeleteForm({ checklistId }: { checklistId: string }) {
  return (
    <form action={deleteChecklistAction} className="shrink-0">
      <input type="hidden" name="checklistId" value={checklistId} />
      <SubmitButton
        variant="outline"
        className="text-xs text-red-700 hover:bg-red-50"
        pendingLabel="Suppression…"
      >
        Supprimer
      </SubmitButton>
    </form>
  );
}

export function ChecklistUpdateNameForm({
  checklistId,
  defaultName,
}: {
  checklistId: string;
  defaultName: string;
}) {
  return (
    <form
      action={wrapFormActionWithToast(updateChecklistNameAction, {
        success: "Nom de la checklist mis à jour",
      })}
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="checklistId" value={checklistId} />
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Intitulé
        </label>
        <Input name="name" defaultValue={defaultName} required />
      </div>
      <SubmitButton variant="outline" pendingLabel="Enregistrement…">
        Mettre à jour le nom
      </SubmitButton>
    </form>
  );
}
