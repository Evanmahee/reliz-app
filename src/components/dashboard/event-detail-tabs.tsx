"use client";

import { useId, useState } from "react";
import {
  addMenuItemAction,
  deleteMenuItemFormAction,
  toggleMenuStockAction,
  updateEventConsignesAction,
  updateEventInformationsAction,
} from "@/app/actions/events";
import { EventQrCard } from "@/components/dashboard/event-qr-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TabId = "infos" | "consignes" | "menu" | "qr";

const TABS: { id: TabId; label: string }[] = [
  { id: "infos", label: "Informations" },
  { id: "consignes", label: "Consignes" },
  { id: "menu", label: "Menu" },
  { id: "qr", label: "QR code" },
];

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
  instructions,
  menuItems,
  guestUrl,
  qrDownloadHref,
}: {
  eventId: string;
  archived: boolean;
  name: string;
  venue: string;
  startsAtLocal: string;
  instructions: string;
  menuItems: EventDetailTabsMenuItem[];
  guestUrl: string;
  qrDownloadHref: string;
}) {
  const uid = useId();
  const [tab, setTab] = useState<TabId>("infos");

  function startsAtLabel() {
    if (!startsAtLocal) return "—";
    const d = new Date(startsAtLocal);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleString("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        });
  }

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1 overflow-x-auto rounded-[1.35rem] border border-zinc-200 bg-zinc-50/80 p-1 sm:flex-wrap"
        role="tablist"
        aria-label="Sections de l’événement"
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-[1.15rem] px-4 py-2.5 text-sm font-medium transition-colors sm:flex-1 sm:px-3 ${
                selected
                  ? "bg-white text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {t.label}
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
              Informations
            </h2>
            {archived ? (
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Nom</dt>
                  <dd className="mt-1 text-zinc-800">{name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Lieu</dt>
                  <dd className="mt-1 text-zinc-800">{venue || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Début</dt>
                  <dd className="mt-1 text-zinc-800">{startsAtLabel()}</dd>
                </div>
              </dl>
            ) : (
              <form
                action={updateEventInformationsAction}
                className="mt-4 space-y-4"
              >
                <input type="hidden" name="eventId" value={eventId} />
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Nom
                  </label>
                  <Input name="name" defaultValue={name} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Lieu
                  </label>
                  <Input name="venue" defaultValue={venue} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Début
                  </label>
                  <Input
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={startsAtLocal}
                  />
                </div>
                <Button type="submit" variant="outline">
                  Enregistrer
                </Button>
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
            <h2 className="text-sm font-semibold text-zinc-900">Consignes</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Instructions visibles par l’équipe sur la fiche événement.
            </p>
            {archived ? (
              <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-800">
                {instructions || "—"}
              </p>
            ) : (
              <form
                action={updateEventConsignesAction}
                className="mt-4 space-y-4"
              >
                <input type="hidden" name="eventId" value={eventId} />
                <Textarea
                  name="instructions"
                  defaultValue={instructions}
                  placeholder="Tenue, contacts sur place, timing du service…"
                  className="min-h-[200px]"
                />
                <Button type="submit" variant="outline">
                  Enregistrer les consignes
                </Button>
              </form>
            )}
          </div>
        ) : null}

        {tab === "menu" ? (
          <div
            role="tabpanel"
            id={`${uid}-panel-menu`}
            aria-labelledby={`${uid}-tab-menu`}
          >
            <h2 className="text-sm font-semibold text-zinc-900">Menu</h2>
            {!archived ? (
              <form action={addMenuItemAction} className="mt-4 space-y-3">
                <input type="hidden" name="eventId" value={eventId} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                    <Input
                      name="name"
                      placeholder="Produit"
                      className="sm:flex-1"
                      required
                    />
                    <Input
                      name="description"
                      placeholder="Description courte"
                      className="sm:flex-1"
                    />
                  </div>
                  <Button type="submit">Ajouter</Button>
                </div>
              </form>
            ) : null}
            <ul className="mt-6 divide-y divide-zinc-100 rounded-[1.25rem] border border-zinc-100 bg-zinc-50/30">
              {menuItems.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-zinc-500">
                  Aucun produit sur cette carte.
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
                          Rupture de stock
                        </span>
                      ) : null}
                    </div>
                    {!archived ? (
                      <div className="flex flex-wrap gap-2">
                        <form action={toggleMenuStockAction}>
                          <input type="hidden" name="menuItemId" value={item.id} />
                          <input type="hidden" name="eventId" value={eventId} />
                          <input
                            type="hidden"
                            name="outOfStock"
                            value={String(!item.outOfStock)}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            className="text-xs"
                          >
                            {item.outOfStock
                              ? "Remettre en stock"
                              : "Rupture de stock"}
                          </Button>
                        </form>
                        <form action={deleteMenuItemFormAction}>
                          <input type="hidden" name="menuItemId" value={item.id} />
                          <input type="hidden" name="eventId" value={eventId} />
                          <Button
                            type="submit"
                            variant="ghost"
                            className="text-xs text-red-700 hover:bg-red-50"
                          >
                            Retirer
                          </Button>
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
            <h2 className="text-sm font-semibold text-zinc-900">QR code</h2>
            {archived ? (
              <p className="mt-4 text-sm text-zinc-500">
                Le QR invité n’est plus disponible pour un événement archivé.
              </p>
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
