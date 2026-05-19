import type { InstructionBlock, InstructionCheckboxBlock } from "@/lib/instructions-blocks";
import { parseInstructionsBlocks } from "@/lib/instructions-blocks";

export type CheckboxTaskRow = {
  eventId: string;
  eventName: string;
  blockId: string;
  label: string;
  checked: boolean;
  assignedToId: string | null;
};

export function extractCheckboxTasks(
  eventId: string,
  eventName: string,
  instructionsBlocks: unknown,
  legacyInstructions: string,
): CheckboxTaskRow[] {
  const blocks = parseInstructionsBlocks(instructionsBlocks, legacyInstructions);
  return blocks
    .filter((b): b is InstructionCheckboxBlock => b.type === "checkbox")
    .map((b) => ({
      eventId,
      eventName,
      blockId: b.id,
      label: b.label,
      checked: b.checked,
      assignedToId: b.assignedToId ?? null,
    }));
}

export function filterTasksForUser(
  tasks: CheckboxTaskRow[],
  userId: string,
  role: string,
): CheckboxTaskRow[] {
  if (role === "STAFF") {
    return tasks.filter((t) => !t.checked && t.assignedToId === userId);
  }
  return tasks.filter((t) => !t.checked);
}

export function assigneeDisplayName(
  assignedToId: string | null,
  staffById: Map<string, { name: string | null; email: string }>,
): string | null {
  if (!assignedToId) return null;
  const s = staffById.get(assignedToId);
  return s ? s.name?.trim() || s.email : null;
}
