"use client";

import {
  toggleInstructionCheckboxAction,
  updateEventConsignesAction,
} from "@/app/actions/events";
import { InstructionBlocksEditor } from "@/components/dashboard/instruction-blocks-editor";
import { useT } from "@/i18n/i18n-provider";
import type { InstructionBlock } from "@/lib/instructions-blocks";

function staffName(
  id: string | null | undefined,
  staffById: Map<string, { name: string | null; email: string }>,
) {
  if (!id) return null;
  const s = staffById.get(id);
  return s ? s.name?.trim() || s.email : null;
}

export function ConsignesReadOnly({
  blocks,
  staffMembers = [],
}: {
  blocks: InstructionBlock[];
  staffMembers?: { id: string; name: string | null; email: string }[];
}) {
  const { t } = useT();
  const staffById = new Map(staffMembers.map((s) => [s.id, s]));
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
              {staffName(b.assignedToId, staffById) ? (
                <span className="ml-2 text-xs font-medium text-violet-700">
                  → {staffName(b.assignedToId, staffById)}
                </span>
              ) : null}
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
  staffMembers = [],
}: {
  eventId: string;
  initialBlocks: InstructionBlock[];
  staffMembers?: { id: string; name: string | null; email: string }[];
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
        staffMembers={staffMembers}
      />
    </div>
  );
}
