"use client";

import { useMemo, useRef } from "react";
import { nanoid } from "nanoid";
import { createChecklistAction } from "@/app/actions/checklists";
import { useT } from "@/i18n/i18n-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateChecklistForm({ showNameError }: { showNameError: boolean }) {
  const { t } = useT();
  const clientChecklistId = useMemo(() => nanoid(), []);
  const submitLock = useRef(false);

  return (
    <Card className="px-5 py-6 sm:px-6 sm:py-8">
      <form
        action={createChecklistAction}
        onSubmit={(e) => {
          if (submitLock.current) {
            e.preventDefault();
            return;
          }
          submitLock.current = true;
        }}
        className="space-y-5"
      >
        <input type="hidden" name="clientChecklistId" value={clientChecklistId} />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            {t("checklists.nameLabel")}
          </label>
          <Input
            name="name"
            required
            placeholder={t("checklists.namePlaceholder")}
          />
        </div>
        {showNameError ? (
          <p className="text-sm text-red-600">{t("checklists.nameError")}</p>
        ) : null}
        <p className="text-xs text-zinc-500">{t("checklists.hint")}</p>
        <SubmitButton className="w-full" pendingLabel={t("checklists.creating")}>
          {t("checklists.createSubmit")}
        </SubmitButton>
      </form>
    </Card>
  );
}
