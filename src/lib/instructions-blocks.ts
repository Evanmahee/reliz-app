import { nanoid } from "nanoid";

export const INSTRUCTIONS_MAX_BLOCKS = 80;
export const INSTRUCTIONS_MAX_PARAGRAPH_LEN = 12000;
export const INSTRUCTIONS_MAX_LABEL_LEN = 500;

export type InstructionParagraphBlock = {
  type: "paragraph";
  id: string;
  content: string;
};

export type InstructionCheckboxBlock = {
  type: "checkbox";
  id: string;
  label: string;
  checked: boolean;
};

export type InstructionBlock =
  | InstructionParagraphBlock
  | InstructionCheckboxBlock;

function clampParagraph(s: string) {
  return s.slice(0, INSTRUCTIONS_MAX_PARAGRAPH_LEN);
}

function clampLabel(s: string) {
  return s.slice(0, INSTRUCTIONS_MAX_LABEL_LEN);
}

/** Lit le JSON stocké ou retombe sur l’ancien champ texte unique. */
export function parseInstructionsBlocks(
  json: unknown,
  legacyInstructions: string,
): InstructionBlock[] {
  if (json != null && Array.isArray(json)) {
    const out: InstructionBlock[] = [];
    for (const item of json) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      if (
        o.type === "paragraph" &&
        typeof o.id === "string" &&
        typeof o.content === "string"
      ) {
        out.push({
          type: "paragraph",
          id: o.id,
          content: clampParagraph(o.content),
        });
      } else if (
        o.type === "checkbox" &&
        typeof o.id === "string" &&
        typeof o.label === "string"
      ) {
        out.push({
          type: "checkbox",
          id: o.id,
          label: clampLabel(o.label),
          checked: Boolean(o.checked),
        });
      }
      if (out.length >= INSTRUCTIONS_MAX_BLOCKS) break;
    }
    if (out.length > 0) return out;
  }
  const legacy = legacyInstructions.trim();
  if (legacy) {
    return [{ type: "paragraph", id: nanoid(), content: legacyInstructions }];
  }
  return [{ type: "paragraph", id: nanoid(), content: "" }];
}

/** Texte plat pour l’ancienne colonne `instructions` (exports, recherche). */
export function flattenBlocksToPlainText(blocks: InstructionBlock[]): string {
  const parts = blocks.map((b) => {
    if (b.type === "paragraph") return b.content.trim();
    const mark = b.checked ? "☑" : "☐";
    return `${mark} ${b.label.trim()}`.trim();
  });
  return parts.filter(Boolean).join("\n\n");
}

export function validateAndNormalizeBlocksFromJson(
  raw: string,
  legacyInstructions: string,
): InstructionBlock[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return parseInstructionsBlocks(null, legacyInstructions);
  }
  if (!Array.isArray(parsed)) {
    return parseInstructionsBlocks(null, legacyInstructions);
  }
  return parseInstructionsBlocks(parsed, legacyInstructions).slice(
    0,
    INSTRUCTIONS_MAX_BLOCKS,
  );
}

export function ensureBlocksDraft(blocks: InstructionBlock[]): InstructionBlock[] {
  if (blocks.length === 0) {
    return [{ type: "paragraph", id: nanoid(), content: "" }];
  }
  return blocks;
}

/** Copie profonde avec nouveaux id (ex. application d’un modèle à un événement). */
export function cloneBlocksWithNewIds(blocks: InstructionBlock[]): InstructionBlock[] {
  return blocks.map((b) =>
    b.type === "paragraph"
      ? { type: "paragraph", id: nanoid(), content: b.content }
      : {
          type: "checkbox",
          id: nanoid(),
          label: b.label,
          checked: b.checked,
        },
  );
}
