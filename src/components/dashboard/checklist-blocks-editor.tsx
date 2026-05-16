"use client";

import {
  toggleChecklistCheckboxAction,
  updateChecklistBlocksAction,
} from "@/app/actions/checklists";
import { InstructionBlocksEditor } from "@/components/dashboard/instruction-blocks-editor";
import { useT } from "@/i18n/i18n-provider";
import type { InstructionBlock } from "@/lib/instructions-blocks";

export function ChecklistBlocksEditor({
  checklistId,
  initialBlocks,
}: {
  checklistId: string;
  initialBlocks: InstructionBlock[];
}) {
  const { t } = useT();
  return (
    <InstructionBlocksEditor
      initialBlocks={initialBlocks}
      entityIdFieldName="checklistId"
      entityId={checklistId}
      payloadFieldName="blocksPayload"
      formAction={updateChecklistBlocksAction}
      toggleCheckboxAction={toggleChecklistCheckboxAction}
      submitLabel={t("checklists.saveChecklist")}
      submitSuccessMessage={t("checklists.toastChecklist")}
    />
  );
}
