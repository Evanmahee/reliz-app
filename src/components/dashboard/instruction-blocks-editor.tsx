"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { MdAdd, MdClose } from "react-icons/md";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { InstructionBlock } from "@/lib/instructions-blocks";
import { isNextRedirectError } from "@/lib/is-next-redirect-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n/i18n-provider";

export type StaffMemberOption = {
  id: string;
  name: string | null;
  email: string;
};

function staffLabel(m: StaffMemberOption) {
  return m.name?.trim() || m.email;
}

export function InstructionBlocksEditor({
  initialBlocks,
  entityIdFieldName,
  entityId,
  payloadFieldName,
  formAction,
  toggleCheckboxAction,
  submitLabel,
  submitSuccessMessage,
  submitErrorMessage,
  checkboxSavedMessage,
  staffMembers = [],
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
  submitSuccessMessage: string;
  submitErrorMessage?: string;
  checkboxSavedMessage?: string;
  /** Si fourni, permet d’assigner chaque tâche à un membre du personnel. */
  staffMembers?: StaffMemberOption[];
}) {
  const { t } = useT();
  const resolvedSubmitError =
    submitErrorMessage ?? t("instructionEditor.submitError");
  const resolvedCheckboxSaved =
    checkboxSavedMessage ?? t("checklists.checkboxSaved");

  const [checkboxPending, startCheckbox] = useTransition();
  const [blocks, setBlocks] = useState<InstructionBlock[]>(initialBlocks);
  const staffById = useMemo(
    () => new Map(staffMembers.map((s) => [s.id, s])),
    [staffMembers],
  );

  const serialized = JSON.stringify(initialBlocks);
  useEffect(() => {
    setBlocks(JSON.parse(serialized) as InstructionBlock[]);
  }, [serialized]);

  const onSubmit = useCallback(
    async (formData: FormData) => {
      try {
        await formAction(formData);
        toast.success(submitSuccessMessage);
      } catch (err) {
        if (isNextRedirectError(err)) throw err;
        console.error(err);
        toast.error(resolvedSubmitError);
      }
    },
    [formAction, submitSuccessMessage, resolvedSubmitError],
  );

  function addParagraph() {
    setBlocks((prev) => [
      ...prev,
      { type: "paragraph", id: nanoid(), content: "" },
    ]);
  }

  function addCheckbox() {
    setBlocks((prev) => [
      ...prev,
      {
        type: "checkbox",
        id: nanoid(),
        label: "",
        checked: false,
        assignedToId: null,
      },
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

  function updateCheckboxAssignee(id: string, assignedToId: string) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.type === "checkbox" && b.id === id
          ? { ...b, assignedToId: assignedToId || null }
          : b,
      ),
    );
  }

  function toggleCheckboxLocal(id: string, checked: boolean) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.type === "checkbox" && b.id === id ? { ...b, checked } : b,
      ),
    );
    startCheckbox(async () => {
      try {
        await toggleCheckboxAction(entityId, id, checked);
        toast.success(resolvedCheckboxSaved, {
          id: "instruction-checkbox-save",
          duration: 2000,
        });
      } catch (err) {
        if (isNextRedirectError(err)) throw err;
        toast.error(t("instructionEditor.checkboxSaveFailed"));
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
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
          disabled={checkboxPending}
        >
          <MdAdd className="size-4" aria-hidden />
          {t("instructionEditor.addText")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={addCheckbox}
          disabled={checkboxPending}
        >
          <MdAdd className="size-4" aria-hidden />
          {t("instructionEditor.addCheckbox")}
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
                  ? `${t("instructionEditor.textBlock")} ${index + 1}`
                  : `${t("instructionEditor.taskBlock")} ${index + 1}`}
                {b.type === "checkbox" && b.assignedToId ? (
                  <span className="ml-1.5 font-normal normal-case text-violet-700">
                    ·{" "}
                    {staffById.get(b.assignedToId)
                      ? staffLabel(staffById.get(b.assignedToId)!)
                      : "—"}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => removeBlock(b.id)}
                disabled={checkboxPending}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-40"
                aria-label={t("instructionEditor.removeBlock")}
              >
                <MdClose className="size-4" />
              </button>
            </div>
            {b.type === "paragraph" ? (
              <Textarea
                value={b.content}
                onChange={(e) => updateParagraph(b.id, e.target.value)}
                placeholder={t("instructionEditor.paragraphPh")}
                className="mt-2 min-h-[88px]"
                disabled={checkboxPending}
              />
            ) : (
              <div className="mt-2 space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={b.checked}
                    onChange={(e) =>
                      toggleCheckboxLocal(b.id, e.target.checked)
                    }
                    disabled={checkboxPending}
                    className="mt-2 size-4 shrink-0 rounded border-zinc-300 accent-zinc-900"
                    aria-label={t("instructionEditor.checkboxAria")}
                  />
                  <Input
                    value={b.label}
                    onChange={(e) =>
                      updateCheckboxLabel(b.id, e.target.value)
                    }
                    placeholder={t("instructionEditor.checkboxPh")}
                    className="flex-1"
                    disabled={checkboxPending}
                  />
                </div>
                <div className="pl-7">
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    {t("instructionEditor.assignTo")}
                  </label>
                  {staffMembers.length > 0 ? (
                    <select
                      value={b.assignedToId ?? ""}
                      onChange={(e) =>
                        updateCheckboxAssignee(b.id, e.target.value)
                      }
                      disabled={checkboxPending}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">
                        {t("instructionEditor.assignAnyone")}
                      </option>
                      {staffMembers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {staffLabel(s)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs leading-relaxed text-zinc-500">
                      {t("instructionEditor.noStaffForAssign")}{" "}
                      <Link
                        href="/dashboard/equipe"
                        className="font-medium text-violet-700 underline underline-offset-2"
                      >
                        {t("instructionEditor.manageTeam")}
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <SubmitButton variant="outline" pendingLabel={t("instructionEditor.submitPending")}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
