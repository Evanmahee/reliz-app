"use client";

import { useId, useMemo, useState } from "react";
import {
  addMenuItemAction,
  deleteMenuItemFormAction,
  toggleMenuStockAction,
  updateEventInformationsAction,
} from "@/app/actions/events";
import {
  ConsignesEditor,
  ConsignesReadOnly,
} from "@/components/dashboard/consignes-editor";
import { EventQrCard } from "@/components/dashboard/event-qr-card";
import { Card } from "@/components/ui/card";
import { wrapFormActionWithToast } from "@/components/ui/form-action-toast";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { dateLocaleTag } from "@/i18n/date-locale";
import { useT } from "@/i18n/i18n-provider";
import type { InstructionBlock } from "@/lib/instructions-blocks";

type TabId = "infos" | "consignes" | "menu" | "qr";

const TAB_IDS: TabId[] = ["infos", "consignes", "menu", "qr"];

export type EventDetailTabsMenuItem = {
  id: string;
  name: string;
  description: string;
  outOfStock: boolean;
};

export function EventDetailTabs({
  eventId,
  archived,
  name,
  venue,
  startsAtLocal,
  instructionBlocks,
  menuItems,
  guestUrl,
  qrDownloadHref,
}: {
  eventId: string;
  archived: boolean;
  name: string;
  venue: string;
  startsAtLocal: string;
  instructionBlocks: InstructionBlock[];
  menuItems: EventDetailTabsMenuItem[];
  guestUrl: string;
  qrDownloadHref: string;
}) {
  const { t, locale } = useT();
  const uid = useId();
  const [tab, setTab] = useState<TabId>("infos");

  const tabLabels = useMemo(
    () => ({
      infos: t("events.tabs.infos"),
      consignes: t("events.tabs.consignes"),
      menu: t("events.tabs.menu"),
      qr: t("events.tabs.qr"),
    }),
    [t],
  );

  const updateInfosWrapped = useMemo(
    () =>
      wrapFormActionWithToast(updateEventInformationsAction, {
        success: t("events.toast.infoSaved"),
      }),
    [t],
  );

  const addMenuWrapped = useMemo(
    () =>
      wrapFormActionWithToast(addMenuItemAction, {
        success: t("events.toast.productAdded"),
      }),
    [t],
  );

  function startsAtLabel() {
    if (!startsAtLocal) return "—";
    const d = new Date(startsAtLocal);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleString(dateLocaleTag(locale), {
          dateStyle: "medium",
          timeStyle: "short",
        });
  }

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1 overflow-x-auto rounded-[1.35rem] border border-zinc-200 bg-zinc-50/80 p-1 sm:flex-wrap"
        role="tablist"
        aria-label={t("events.tablistAria")}
      >
        {TAB_IDS.map((id) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`${uid}-tab-${id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(id)}
              className={`shrink-0 rounded-[1.15rem] px-4 py-2.5 text-sm font-medium transition-colors sm:flex-1 sm:px-3 ${
                selected
                  ? "bg-white text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tabLabels[id]}
            </button>
          );
        })}
      </div>

      <Card className="px-5 py-6 sm:px-6">
        {tab === "infos" ? (
          <div
            role="tabpanel"
            id={`${uid}-panel-infos`}
            aria-labelledby={`${uid}-tab-infos`}
          >
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("events.infoTitle")}
            </h2>
            {archived ? (
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-zinc-500">
                    {t("events.name")}
                  </dt>
                  <dd className="mt-1 text-zinc-800">{name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-zinc-500">
                    {t("events.venue")}
                  </dt>
                  <dd className="mt-1 text-zinc-800">{venue || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-zinc-500">
                    {t("events.starts")}
                  </dt>
                  <dd className="mt-1 text-zinc-800">{startsAtLabel()}</dd>
                </div>
              </dl>
            ) : (
              <form action={updateInfosWrapped} className="mt-4 space-y-4">
                <input type="hidden" name="eventId" value={eventId} />
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    {t("events.name")}
                  </label>
                  <Input name="name" defaultValue={name} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    {t("events.venue")}
                  </label>
                  <Input name="venue" defaultValue={venue} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    {t("events.starts")}
                  </label>
                  <Input
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={startsAtLocal}
                  />
                </div>
                <SubmitButton variant="outline" pendingLabel={t("events.saving")}>
                  {t("events.saveInfos")}
                </SubmitButton>
              </form>
            )}
          </div>
        ) : null}

        {tab === "consignes" ? (
          <div
            role="tabpanel"
            id={`${uid}-panel-consignes`}
            aria-labelledby={`${uid}-tab-consignes`}
          >
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("events.consignesTitle")}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">{t("events.consignesHint")}</p>
            {archived ? (
              <ConsignesReadOnly blocks={instructionBlocks} />
            ) : (
              <ConsignesEditor
                eventId={eventId}
                initialBlocks={instructionBlocks}
              />
            )}
          </div>
        ) : null}

        {tab === "menu" ? (
          <div
            role="tabpanel"
            id={`${uid}-panel-menu`}
            aria-labelledby={`${uid}-tab-menu`}
          >
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("events.menuTitle")}
            </h2>
            {!archived ? (
              <form action={addMenuWrapped} className="mt-4 space-y-3">
                <input type="hidden" name="eventId" value={eventId} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                    <Input
                      name="name"
                      placeholder={t("events.product")}
                      className="sm:flex-1"
                      required
                    />
                    <Input
                      name="description"
                      placeholder={t("events.descShort")}
                      className="sm:flex-1"
                    />
                  </div>
                  <SubmitButton pendingLabel={t("events.adding")}>
                    {t("events.add")}
                  </SubmitButton>
                </div>
              </form>
            ) : null}
            <ul className="mt-6 divide-y divide-zinc-100 rounded-[1.25rem] border border-zinc-100 bg-zinc-50/30">
              {menuItems.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-zinc-500">
                  {t("events.emptyMenu")}
                </li>
              ) : (
                menuItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">{item.name}</p>
                      {item.description ? (
                        <p className="mt-0.5 text-sm text-zinc-500">
                          {item.description}
                        </p>
                      ) : null}
                      {item.outOfStock ? (
                        <span className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                          {t("events.outOfStock")}
                        </span>
                      ) : null}
                    </div>
                    {!archived ? (
                      <div className="flex flex-wrap gap-2">
                        <form
                          action={wrapFormActionWithToast(toggleMenuStockAction, {
                            success: t("events.toast.stockUpdated"),
                          })}
                        >
                          <input type="hidden" name="menuItemId" value={item.id} />
                          <input type="hidden" name="eventId" value={eventId} />
                          <input
                            type="hidden"
                            name="outOfStock"
                            value={String(!item.outOfStock)}
                          />
                          <SubmitButton
                            variant="outline"
                            className="text-xs"
                            pendingLabel="…"
                          >
                            {item.outOfStock
                              ? t("events.backInStock")
                              : t("events.outStockBtn")}
                          </SubmitButton>
                        </form>
                        <form
                          action={wrapFormActionWithToast(deleteMenuItemFormAction, {
                            success: t("events.toast.productRemoved"),
                          })}
                        >
                          <input type="hidden" name="menuItemId" value={item.id} />
                          <input type="hidden" name="eventId" value={eventId} />
                          <SubmitButton
                            variant="ghost"
                            className="text-xs text-red-700 hover:bg-red-50"
                            pendingLabel="…"
                          >
                            {t("events.remove")}
                          </SubmitButton>
                        </form>
                      </div>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}

        {tab === "qr" ? (
          <div
            role="tabpanel"
            id={`${uid}-panel-qr`}
            aria-labelledby={`${uid}-tab-qr`}
          >
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("events.qrTitle")}
            </h2>
            {archived ? (
              <p className="mt-4 text-sm text-zinc-500">{t("events.qrArchived")}</p>
            ) : (
              <div className="mt-4">
                <EventQrCard url={guestUrl} downloadHref={qrDownloadHref} />
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
