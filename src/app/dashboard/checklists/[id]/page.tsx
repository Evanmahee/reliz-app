import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  deleteChecklistAction,
  updateChecklistNameAction,
} from "@/app/actions/checklists";
import { ChecklistBlocksEditor } from "@/components/dashboard/checklist-blocks-editor";
import { Button, outlineButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSessionUserId } from "@/lib/auth";
import { parseInstructionsBlocks } from "@/lib/instructions-blocks";
import { prisma } from "@/lib/prisma";

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const { id } = await params;

  const checklist = await prisma.checklist.findFirst({
    where: { id, ownerId: userId },
  });
  if (!checklist) notFound();

  const blocks = parseInstructionsBlocks(checklist.blocks, "");

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/checklists" className={outlineButtonClassName}>
            ← Checklists
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
            {checklist.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Modèle réutilisable pour préremplir les consignes d’un nouvel événement.
          </p>
        </div>
        <form action={deleteChecklistAction} className="shrink-0">
          <input type="hidden" name="checklistId" value={checklist.id} />
          <Button
            type="submit"
            variant="outline"
            className="text-xs text-red-700 hover:bg-red-50"
          >
            Supprimer
          </Button>
        </form>
      </div>

      <Card className="px-5 py-6 sm:px-6">
        <h2 className="text-sm font-semibold text-zinc-900">Nom</h2>
        <form action={updateChecklistNameAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="checklistId" value={checklist.id} />
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Intitulé
            </label>
            <Input name="name" defaultValue={checklist.name} required />
          </div>
          <Button type="submit" variant="outline">
            Mettre à jour le nom
          </Button>
        </form>
      </Card>

      <Card className="px-5 py-6 sm:px-6">
        <h2 className="text-sm font-semibold text-zinc-900">Contenu</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Textes libres et tâches à cocher (comme sur Notion). Les coches sont
          enregistrées tout de suite ; utilisez le bouton pour sauver tout le reste.
        </p>
        <ChecklistBlocksEditor checklistId={checklist.id} initialBlocks={blocks} />
      </Card>
    </div>
  );
}
