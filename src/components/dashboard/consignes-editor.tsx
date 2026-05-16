"use client";

import {
  toggleInstructionCheckboxAction,
  updateEventConsignesAction,
} from "@/app/actions/events";
import { InstructionBlocksEditor } from "@/components/dashboard/instruction-blocks-editor";
import { useT } from "@/i18n/i18n-provider";
import type { InstructionBlock } from "@/lib/instructions-blocks";

export function ConsignesReadOnly({ blocks }: { blocks: InstructionBlock[] }) {
  const { t } = useT();
  if (
    blocks.length === 1 &&
    blocks[0].type === "paragraph" &&
    !blocks[0].content.trim()
  ) {
    return <p className="mt-4 text-sm text-zinc-500">—</p>;
  }
  return (
    <div className="mt-4 space-y-4">
      {blocks.map((b) => {
        if (b.type === "paragraph") {
          return (
            <p
              key={b.id}
              className="whitespace-pre-wrap text-sm text-zinc-800"
            >
              {b.content.trim() ? (
                b.content
              ) : (
                <span className="text-zinc-400">—</span>
              )}
            </p>
          );
        }
        return (
          <label
            key={b.id}
            className="flex cursor-default items-start gap-3 text-sm text-zinc-800"
          >
            <input
              type="checkbox"
              checked={b.checked}
              readOnly
              disabled
              className="mt-1 size-4 shrink-0 rounded border-zinc-300 accent-zinc-900 opacity-70"
            />
            <span className={b.checked ? "text-zinc-500 line-through" : ""}>
              {b.label.trim() || t("instructionEditor.untitled")}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function ConsignesEditor({
  eventId,
  initialBlocks,
}: {
  eventId: string;
  initialBlocks: InstructionBlock[];
}) {
  const { t } = useT();
  return (
    <div className="mt-4">
      <InstructionBlocksEditor
        initialBlocks={initialBlocks}
        entityIdFieldName="eventId"
        entityId={eventId}
        payloadFieldName="instructionsPayload"
        formAction={updateEventConsignesAction}
        toggleCheckboxAction={toggleInstructionCheckboxAction}
        submitLabel={t("checklists.saveConsignes")}
        submitSuccessMessage={t("checklists.toastConsignes")}
      />
    </div>
  );
}
