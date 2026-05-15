"use client";

import { useEffect, useState, useTransition } from "react";
import { MdAdd, MdClose } from "react-icons/md";
import { nanoid } from "nanoid";
import type { InstructionBlock } from "@/lib/instructions-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function InstructionBlocksEditor({
  initialBlocks,
  entityIdFieldName,
  entityId,
  payloadFieldName,
  formAction,
  toggleCheckboxAction,
  submitLabel,
}: {
  initialBlocks: InstructionBlock[];
  entityIdFieldName: string;
  entityId: string;
  payloadFieldName: string;
  formAction: (formData: FormData) => void | Promise<void>;
  toggleCheckboxAction: (
    entityId: string,
    blockId: string,
    checked: boolean,
  ) => void | Promise<void>;
  submitLabel: string;
}) {
  const [pending, start] = useTransition();
  const [blocks, setBlocks] = useState<InstructionBlock[]>(initialBlocks);

  const serialized = JSON.stringify(initialBlocks);
  useEffect(() => {
    setBlocks(JSON.parse(serialized) as InstructionBlock[]);
  }, [serialized]);

  function addParagraph() {
    setBlocks((prev) => [
      ...prev,
      { type: "paragraph", id: nanoid(), content: "" },
    ]);
  }

  function addCheckbox() {
    setBlocks((prev) => [
      ...prev,
      { type: "checkbox", id: nanoid(), label: "", checked: false },
    ]);
  }

  function removeBlock(id: string) {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      return next.length === 0
        ? [{ type: "paragraph", id: nanoid(), content: "" }]
        : next;
    });
  }

  function updateParagraph(id: string, content: string) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.type === "paragraph" && b.id === id ? { ...b, content } : b,
      ),
    );
  }

  function updateCheckboxLabel(id: string, label: string) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.type === "checkbox" && b.id === id ? { ...b, label } : b,
      ),
    );
  }

  function toggleCheckboxLocal(id: string, checked: boolean) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.type === "checkbox" && b.id === id ? { ...b, checked } : b,
      ),
    );
    start(async () => {
      await toggleCheckboxAction(entityId, id, checked);
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name={entityIdFieldName} value={entityId} />
      <input
        type="hidden"
        name={payloadFieldName}
        value={JSON.stringify(blocks)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={addParagraph}
        >
          <MdAdd className="size-4" aria-hidden />
          Bloc texte
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={addCheckbox}
        >
          <MdAdd className="size-4" aria-hidden />
          Case à cocher
        </Button>
      </div>

      <ul className="space-y-3">
        {blocks.map((b, index) => (
          <li
            key={b.id}
            className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {b.type === "paragraph"
                  ? `Texte ${index + 1}`
                  : `Tâche ${index + 1}`}
              </span>
              <button
                type="button"
                onClick={() => removeBlock(b.id)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                aria-label="Retirer ce bloc"
              >
                <MdClose className="size-4" />
              </button>
            </div>
            {b.type === "paragraph" ? (
              <Textarea
                value={b.content}
                onChange={(e) => updateParagraph(b.id, e.target.value)}
                placeholder="Consigne libre…"
                className="mt-2 min-h-[88px]"
              />
            ) : (
              <div className="mt-2 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={b.checked}
                  onChange={(e) =>
                    toggleCheckboxLocal(b.id, e.target.checked)
                  }
                  disabled={pending}
                  className="mt-2 size-4 shrink-0 rounded border-zinc-300 accent-zinc-900"
                  aria-label="Cocher la tâche"
                />
                <Input
                  value={b.label}
                  onChange={(e) =>
                    updateCheckboxLabel(b.id, e.target.value)
                  }
                  placeholder="Intitulé de la case…"
                  className="flex-1"
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      <Button type="submit" variant="outline">
        {submitLabel}
      </Button>
    </form>
  );
}
