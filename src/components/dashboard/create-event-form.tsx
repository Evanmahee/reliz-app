"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { nanoid } from "nanoid";
import { createEventAction } from "@/app/actions/events";
import { useT } from "@/i18n/i18n-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const selectClassName =
  "flex h-11 w-full rounded-[1rem] border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-offset-white focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10";

export function CreateEventForm({
  checklists,
  showNameError,
}: {
  checklists: { id: string; name: string }[];
  showNameError: boolean;
}) {
  const { t } = useT();
  const clientEventId = useMemo(() => nanoid(), []);
  const submitLock = useRef(false);

  return (
    <Card className="px-5 py-6 sm:px-6 sm:py-8">
      <form
        action={createEventAction}
        onSubmit={(e) => {
          if (submitLock.current) {
            e.preventDefault();
            return;
          }
          submitLock.current = true;
        }}
        className="space-y-5"
      >
        <input type="hidden" name="clientEventId" value={clientEventId} />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            {t("events.nameLabel")}
          </label>
          <Input
            name="name"
            required
            placeholder={t("events.namePlaceholder")}
          />
        </div>
        {showNameError ? (
          <p className="text-sm text-red-600">{t("events.nameRequired")}</p>
        ) : null}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            {t("events.venueLabel")}
          </label>
          <Input name="venue" placeholder="Domaine des Acacias" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            {t("events.startsLabel")}
          </label>
          <Input name="startsAt" type="datetime-local" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            {t("events.checklistLabel")}
          </label>
          <select name="checklistId" className={selectClassName} defaultValue="">
            <option value="">{t("events.checklistNone")}</option>
            {checklists.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-zinc-500">
            {t("events.checklistHelpBefore")}{" "}
            <Link
              href="/dashboard/checklists"
              className="font-medium text-zinc-800 underline"
            >
              {t("events.checklistHelpLink")}
            </Link>
            {t("events.checklistHelpAfter")}
          </p>
        </div>
        <SubmitButton className="w-full" pendingLabel={t("events.creating")}>
          {t("events.createSubmit")}
        </SubmitButton>
      </form>
    </Card>
  );
}
