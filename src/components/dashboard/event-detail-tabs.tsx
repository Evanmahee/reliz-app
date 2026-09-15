"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  addEventAccessoryAction,
  addMenuItemAction,
  deleteEventAccessoryAction,
  deleteMenuItemFormAction,
  toggleEventMenuHiddenAction,
  toggleMenuItemHiddenAction,
  toggleMenuStockAction,
  updateEventInformationsAction,
} from "@/app/actions/events";
import {
  ConsignesEditor,
  ConsignesReadOnly,
} from "@/components/dashboard/consignes-editor";
import { EventTasksCardList } from "@/components/dashboard/event-tasks-card-list";
import {
  EventShoppingPanel,
  type EventShoppingListData,
} from "@/components/dashboard/event-shopping-panel";
import { EventQrCard } from "@/components/dashboard/event-qr-card";
import {
  EventTablesPanel,
  type EventTableRow,
} from "@/components/dashboard/event-tables-panel";
import { Card } from "@/components/ui/card";
import { wrapFormActionWithToast } from "@/components/ui/form-action-toast";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { dateLocaleTag } from "@/i18n/date-locale";
import { useT } from "@/i18n/i18n-provider";
import type { InstructionBlock } from "@/lib/instructions-blocks";

type TabId =
  | "infos"
  | "consignes"
  | "menu"
  | "accessories"
  | "shopping"
  | "tables"
  | "qr";

const TAB_IDS: TabId[] = [
  "infos",
  "consignes",
  "menu",
  "accessories",
  "shopping",
  "tables",
  "qr",
];

export type EventDetailTabsMenuItem = {
  id: string;
  name: string;
  description: string;
  outOfStock: boolean;
  hidden: boolean;
};

export type EventDetailTabsAccessory = {
  id: string;
  name: string;
  quantity: number;
  notes: string;
};

export function EventDetailTabs({
  eventId,
  archived,
  isOwner,
  canManageOps,
  name,
  venue,
  menuHidden,
  startsAtLocal,
  instructionBlocks,
  menuItems,
  accessories,
  shoppingList,
  staffMembers,
  guestUrl,
  publicSlug,
  qrDownloadHref,
}: {
  eventId: string;
  archived: boolean;
  isOwner: boolean;
  canManageOps: boolean;
  name: string;
  venue: string;
  menuHidden: boolean;
  startsAtLocal: string;
  instructionBlocks: InstructionBlock[];
  menuItems: EventDetailTabsMenuItem[];
  accessories: EventDetailTabsAccessory[];
  shoppingList: EventShoppingListData | null;
  staffMembers: { id: string; name: string | null; email: string }[];
  guestUrl: string;
  publicSlug: string;
  qrDownloadHref: string;
}) {
  const { t, locale } = useT();
  const uid = useId();
  const [tab, setTab] = useState<TabId>("infos");
  const [tables, setTables] = useState<EventTableRow[]>([]);

  const tabLabels = useMemo(
    () => ({
      infos: t("events.tabs.infos"),
      consignes: t("events.tabs.consignes"),
      menu: t("events.tabs.menu"),
      accessories: t("events.tabs.accessories"),
      shopping: t("events.tabs.shopping"),
      tables: t("events.tabs.tables"),
      qr: t("events.tabs.qr"),
    }),
    [t],
  );

  const visibleTabs = isOwner
    ? TAB_IDS
    : canManageOps
      ? TAB_IDS.filter((id) => id !== "infos" && id !== "shopping")
      : TAB_IDS.filter(
          (id) =>
            id !== "infos" &&
            id !== "qr" &&
            id !== "shopping" &&
            id !== "tables",
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
        {visibleTabs.map((id) => {
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
              className={`shrink-0 rounded-[1.15rem] px-4 py-2.5 text-sm transition-colors sm:flex-1 sm:px-3 ${
                selected
                  ? "bg-white font-semibold text-zinc-900"
                  : "font-medium text-zinc-500 hover:text-zinc-800"
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
            {archived || !isOwner ? (
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
              <ConsignesReadOnly
                blocks={instructionBlocks}
                staffMembers={staffMembers}
              />
            ) : canManageOps ? (
              <ConsignesEditor
                eventId={eventId}
                initialBlocks={instructionBlocks}
                staffMembers={staffMembers}
              />
            ) : (
              <ConsignesReadOnly
                blocks={instructionBlocks}
                staffMembers={staffMembers}
              />
            )}
            <EventTasksCardList
              eventId={eventId}
              eventName={name}
              blocks={instructionBlocks}
              staffMembers={staffMembers}
            />
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
            {!archived && canManageOps ? (
              <form
                action={wrapFormActionWithToast(toggleEventMenuHiddenAction, {
                  success: t("events.toast.menuVisibility"),
                })}
                className="mt-3"
              >
                <input type="hidden" name="eventId" value={eventId} />
                <input
                  type="hidden"
                  name="menuHidden"
                  value={String(!menuHidden)}
                />
                <SubmitButton variant="outline" className="text-xs" pendingLabel="…">
                  {menuHidden ? t("events.showMenu") : t("events.hideMenu")}
                </SubmitButton>
              </form>
            ) : null}
            {menuHidden && !archived ? (
              <p className="mt-2 text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                {t("events.menuHiddenHint")}
              </p>
            ) : null}
            {!archived && canManageOps ? (
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
                      {item.hidden ? (
                        <span className="mt-2 inline-block rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                          {t("events.hidden")}
                        </span>
                      ) : null}
                      {item.outOfStock ? (
                        <span className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                          {t("events.outOfStock")}
                        </span>
                      ) : null}
                    </div>
                    {!archived && canManageOps ? (
                      <div className="flex flex-wrap gap-2">
                        <form
                          action={wrapFormActionWithToast(toggleMenuItemHiddenAction, {
                            success: t("events.toast.visibility"),
                          })}
                        >
                          <input type="hidden" name="menuItemId" value={item.id} />
                          <input type="hidden" name="eventId" value={eventId} />
                          <input
                            type="hidden"
                            name="hidden"
                            value={String(!item.hidden)}
                          />
                          <SubmitButton variant="outline" className="text-xs" pendingLabel="…">
                            {item.hidden ? t("events.showProduct") : t("events.hideProduct")}
                          </SubmitButton>
                        </form>
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

        {tab === "accessories" ? (
          <div
            role="tabpanel"
            id={`${uid}-panel-accessories`}
            aria-labelledby={`${uid}-tab-accessories`}
          >
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("events.accessoriesTitle")}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">{t("events.accessoriesHint")}</p>
            {!archived && canManageOps ? (
              <form
                action={wrapFormActionWithToast(addEventAccessoryAction, {
                  success: t("events.toast.accessoryAdded"),
                })}
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="eventId" value={eventId} />
                <Input name="name" placeholder={t("events.accessoryName")} className="sm:flex-1" required />
                <Input name="quantity" type="number" min={1} defaultValue={1} className="w-24" />
                <Input name="notes" placeholder={t("events.accessoryNotes")} className="sm:flex-1" />
                <SubmitButton pendingLabel={t("events.adding")}>{t("events.add")}</SubmitButton>
              </form>
            ) : null}
            <ul className="mt-6 divide-y divide-zinc-100 rounded-[1.25rem] border border-zinc-100">
              {accessories.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-zinc-500">
                  {t("events.emptyAccessories")}
                </li>
              ) : (
                accessories.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">
                        {a.name}{" "}
                        <span className="text-zinc-400">×{a.quantity}</span>
                      </p>
                      {a.notes ? (
                        <p className="mt-0.5 text-sm text-zinc-500">{a.notes}</p>
                      ) : null}
                    </div>
                    {!archived && canManageOps ? (
                      <form
                        action={wrapFormActionWithToast(deleteEventAccessoryAction, {
                          success: t("events.toast.accessoryRemoved"),
                        })}
                      >
                        <input type="hidden" name="eventId" value={eventId} />
                        <input type="hidden" name="accessoryId" value={a.id} />
                        <SubmitButton variant="ghost" className="text-xs text-red-700" pendingLabel="…">
                          {t("events.remove")}
                        </SubmitButton>
                      </form>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}

        {tab === "shopping" ? (
          <div
            role="tabpanel"
            id={`${uid}-panel-shopping`}
            aria-labelledby={`${uid}-tab-shopping`}
          >
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("events.shoppingTitle")}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">{t("events.shoppingHint")}</p>
            <EventShoppingPanel
              eventId={eventId}
              shoppingList={shoppingList}
              archived={archived}
            />
          </div>
        ) : null}

        {tab === "tables" ? (
          <div
            role="tabpanel"
            id={`${uid}-panel-tables`}
            aria-labelledby={`${uid}-tab-tables`}
          >
            <EventTablesPanel
              eventId={eventId}
              archived={archived}
              onTablesChange={setTables}
            />
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
                <EventQrTablesBridge
                  eventId={eventId}
                  guestUrl={guestUrl}
                  publicSlug={publicSlug}
                  qrDownloadHref={qrDownloadHref}
                  tables={tables}
                  onTablesLoaded={setTables}
                />
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

/** Charge les tables pour l’onglet QR si pas encore chargées. */
function EventQrTablesBridge({
  eventId,
  guestUrl,
  publicSlug,
  qrDownloadHref,
  tables,
  onTablesLoaded,
}: {
  eventId: string;
  guestUrl: string;
  publicSlug: string;
  qrDownloadHref: string;
  tables: EventTableRow[];
  onTablesLoaded: (tables: EventTableRow[]) => void;
}) {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/tables`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as EventTableRow[];
        if (!cancelled) onTablesLoaded(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, onTablesLoaded]);

  return (
    <EventQrCard
      url={guestUrl}
      downloadHref={qrDownloadHref}
      eventId={eventId}
      publicSlug={publicSlug}
      tables={tables}
    />
  );
}
