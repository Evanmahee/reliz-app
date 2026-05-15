"use client";

import {
  toggleChecklistCheckboxAction,
  updateChecklistBlocksAction,
} from "@/app/actions/checklists";
import { InstructionBlocksEditor } from "@/components/dashboard/instruction-blocks-editor";
import type { InstructionBlock } from "@/lib/instructions-blocks";

export function ChecklistBlocksEditor({
  checklistId,
  initialBlocks,
}: {
  checklistId: string;
  initialBlocks: InstructionBlock[];
}) {
  return (
    <InstructionBlocksEditor
      initialBlocks={initialBlocks}
      entityIdFieldName="checklistId"
      entityId={checklistId}
      payloadFieldName="blocksPayload"
      formAction={updateChecklistBlocksAction}
      toggleCheckboxAction={toggleChecklistCheckboxAction}
      submitLabel="Enregistrer la checklist"
    />
  );
}
