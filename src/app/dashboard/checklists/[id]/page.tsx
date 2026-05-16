import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChecklistBlocksEditor } from "@/components/dashboard/checklist-blocks-editor";
import {
  ChecklistDeleteForm,
  ChecklistUpdateNameForm,
} from "@/components/dashboard/checklist-detail-forms";
import { outlineButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionUserId } from "@/lib/auth";
import { parseInstructionsBlocks } from "@/lib/instructions-blocks";
import { prisma } from "@/lib/prisma";
import { getT } from "@/i18n/server";

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = await getT();
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
            {t("checklists.detailBack")}
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
            {checklist.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{t("checklists.templateHint")}</p>
        </div>
        <ChecklistDeleteForm checklistId={checklist.id} />
      </div>

      <Card className="px-5 py-6 sm:px-6">
        <h2 className="text-sm font-semibold text-zinc-900">{t("checklists.nameSection")}</h2>
        <ChecklistUpdateNameForm
          checklistId={checklist.id}
          defaultName={checklist.name}
        />
      </Card>

      <Card className="px-5 py-6 sm:px-6">
        <h2 className="text-sm font-semibold text-zinc-900">{t("checklists.contentTitle")}</h2>
        <p className="mt-1 text-xs text-zinc-500">{t("checklists.contentHint")}</p>
        <ChecklistBlocksEditor checklistId={checklist.id} initialBlocks={blocks} />
      </Card>
    </div>
  );
}
