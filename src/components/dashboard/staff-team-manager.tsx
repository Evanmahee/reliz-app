"use client";

import { useMemo, useState } from "react";
import { updateStaffEventsAction } from "@/app/actions/staff";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, primaryButtonClassName } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { wrapFormActionWithToast } from "@/components/ui/form-action-toast";
import { useT } from "@/i18n/i18n-provider";

type StaffRow = {
  id: string;
  name: string | null;
  email: string;
  eventIds: string[];
};

function StaffCreateForm({
  events,
  createAction,
  onCancel,
}: {
  events: { id: string; name: string }[];
  createAction: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useT();
  const createWrapped = useMemo(
    () =>
      wrapFormActionWithToast(createAction, {
        success: t("equipe.toastCreated"),
      }),
    [createAction, t],
  );

  return (
    <form action={createWrapped} className="space-y-4">
      <Input name="name" placeholder={t("equipe.namePh")} required />
      <Input name="email" type="email" placeholder={t("equipe.emailPh")} required />
      <Input
        name="password"
        type="password"
        placeholder={t("equipe.passwordPh")}
        minLength={8}
        required
      />
      {events.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-zinc-500">
            {t("equipe.eventsAccess")}
          </legend>
          {events.map((ev) => (
            <label
              key={ev.id}
              className="flex items-center gap-2 text-sm text-zinc-700"
            >
              <input type="checkbox" name="eventIds" value={ev.id} className="rounded" />
              {ev.name}
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="text-xs text-zinc-500">{t("equipe.noLiveEvents")}</p>
      )}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("equipe.cancel")}
        </Button>
        <SubmitButton pendingLabel={t("equipe.creating")}>{t("equipe.create")}</SubmitButton>
      </div>
    </form>
  );
}

export function StaffTeamManager({
  staff,
  events,
  createAction,
  deleteAction,
}: {
  staff: StaffRow[];
  events: { id: string; name: string }[];
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const { t } = useT();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400">{t("equipe.tag")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {t("equipe.title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">{t("equipe.subtitle")}</p>
        </div>
        <button
          type="button"
          className={`${primaryButtonClassName} shrink-0`}
          onClick={() => setModalOpen(true)}
        >
          {t("equipe.addMember")}
        </button>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t("equipe.addTitle")}
        closeLabel={t("equipe.close")}
      >
        <StaffCreateForm
          events={events}
          createAction={createAction}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Card className="px-5 py-6 sm:px-6">
        <h2 className="text-sm font-semibold text-zinc-900">{t("equipe.listTitle")}</h2>
        {staff.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">{t("equipe.empty")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {staff.map((s) => (
              <li key={s.id} className="py-4 first:pt-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">{s.name || s.email}</p>
                    <p className="text-sm text-zinc-500">{s.email}</p>
                  </div>
                  <form action={deleteAction}>
                    <input type="hidden" name="staffId" value={s.id} />
                    <SubmitButton
                      variant="ghost"
                      className="text-xs text-red-700"
                      pendingLabel="…"
                    >
                      {t("equipe.remove")}
                    </SubmitButton>
                  </form>
                </div>
                {events.length > 0 ? (
                  <form
                    action={wrapFormActionWithToast(updateStaffEventsAction, {
                      success: t("equipe.toastAccess"),
                    })}
                    className="mt-3 space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3"
                  >
                    <input type="hidden" name="staffId" value={s.id} />
                    <p className="text-xs font-medium text-zinc-500">
                      {t("equipe.eventsAccess")}
                    </p>
                    {events.map((ev) => (
                      <label
                        key={ev.id}
                        className="flex items-center gap-2 text-sm text-zinc-700"
                      >
                        <input
                          type="checkbox"
                          name="eventIds"
                          value={ev.id}
                          defaultChecked={s.eventIds.includes(ev.id)}
                          className="rounded"
                        />
                        {ev.name}
                      </label>
                    ))}
                    <SubmitButton variant="outline" className="text-xs" pendingLabel="…">
                      {t("equipe.saveAccess")}
                    </SubmitButton>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
