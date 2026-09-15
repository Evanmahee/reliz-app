"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { GUEST_REQUEST, REQUEST_CATEGORY } from "@/lib/constants";
import { postGuestRequestWithRetry } from "@/lib/guest-request-submit";
import {
  REQUEST_CATEGORY_ORDER,
  REQUEST_CATEGORY_STYLES,
  type RequestCategory,
} from "@/lib/request-category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n/i18n-provider";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  outOfStock: boolean;
  hidden?: boolean;
};

type Tab = "carte" | "services" | "personnel";

export function GuestApp({
  publicSlug,
  eventName,
  menuHidden,
  menuItems,
  initialTableNumber,
  initialTableLocation,
  isVip = false,
}: {
  publicSlug: string;
  eventName: string;
  menuHidden: boolean;
  menuItems: MenuItem[];
  initialTableNumber?: string;
  initialTableLocation?: string;
  isVip?: boolean;
}) {
  const { t, messages } = useT();
  const serviceIdeas = messages.guest
    .serviceIdeas as unknown as readonly string[];

  const storageKey = `reliz_table_${publicSlug}`;
  const locationKey = `reliz_table_loc_${publicSlug}`;
  const [hydrated, setHydrated] = useState(false);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [tableDraft, setTableDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [tab, setTab] = useState<Tab>("carte");
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const [productNote, setProductNote] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [serviceText, setServiceText] = useState("");
  const [serviceCategory, setServiceCategory] = useState<RequestCategory>(
    REQUEST_CATEGORY.MISC,
  );
  const [allergiesDraft, setAllergiesDraft] = useState("");

  useEffect(() => {
    const fromUrl = initialTableNumber?.trim();
    const locFromUrl = initialTableLocation?.trim();
    if (fromUrl) {
      sessionStorage.setItem(storageKey, fromUrl);
      if (locFromUrl) {
        sessionStorage.setItem(locationKey, locFromUrl);
      }
      setTableNumber(fromUrl);
      setLocationDraft(
        locFromUrl || sessionStorage.getItem(locationKey) || "",
      );
    } else {
      setTableNumber(sessionStorage.getItem(storageKey));
      setLocationDraft(sessionStorage.getItem(locationKey) ?? "");
    }
    setHydrated(true);
  }, [storageKey, locationKey, initialTableNumber, initialTableLocation]);

  function saveTable(e: React.FormEvent) {
    e.preventDefault();
    const v = tableDraft.trim();
    if (!v) {
      setError(t("guest.tableError"));
      return;
    }
    sessionStorage.setItem(storageKey, v);
    sessionStorage.setItem(locationKey, locationDraft.trim());
    setTableNumber(v);
    setTableDraft("");
    setError(null);
  }

  function clearTable() {
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(locationKey);
    setTableNumber(null);
    setLocationDraft("");
    setTab("carte");
  }

  function flash(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2400);
  }

  function categoryLabel(cat: RequestCategory) {
    return t(`guest.categories.${cat.toLowerCase()}`);
  }

  const send = useCallback(
    (type: string, message: string, category: RequestCategory) => {
      if (!tableNumber) return;
      setError(null);
      setRetrying(false);
      start(async () => {
        const loc =
          (typeof sessionStorage !== "undefined"
            ? sessionStorage.getItem(locationKey)
            : null) ??
          locationDraft.trim();
        const allergies = allergiesDraft.trim();
        const res = await postGuestRequestWithRetry(
          {
            publicSlug,
            tableNumber,
            tableLocation: loc || undefined,
            type,
            category,
            message,
            allergies: allergies || undefined,
          },
          () => setRetrying(true),
        );
        setRetrying(false);
        if (!res.ok) {
          if (res.error === "network") {
            setError(t("guest.errors.sendFailed"));
          } else if (res.detail) {
            setError(res.detail);
          } else {
            setError(t("guest.errors.sendFailed"));
          }
          return;
        }
        flash(t("guest.requestSent"));
        setProductNote("");
        setSelectedProduct(null);
        setServiceText("");
        setServiceCategory(REQUEST_CATEGORY.MISC);
        if (allergies) setAllergiesDraft("");
      });
    },
    [
      publicSlug,
      tableNumber,
      locationDraft,
      locationKey,
      allergiesDraft,
      t,
    ],
  );

  if (!hydrated) {
    return (
      <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-10 text-center text-sm text-zinc-500">
        {t("guest.loading")}
      </div>
    );
  }

  if (!tableNumber) {
    return (
      <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          {eventName}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{t("guest.intro")}</p>
        <form onSubmit={saveTable} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              {t("guest.tableLabel")}
            </label>
            <Input
              inputMode="numeric"
              placeholder={t("guest.tablePlaceholder")}
              value={tableDraft}
              onChange={(e) => setTableDraft(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              {t("guest.tableLocationLabel")}
            </label>
            <Input
              placeholder={t("guest.tableLocationPh")}
              value={locationDraft}
              onChange={(e) => setLocationDraft(e.target.value)}
              autoComplete="off"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full">
            {t("guest.continue")}
          </Button>
        </form>
      </div>
    );
  }

  const visibleMenu = menuItems.filter((m) => !m.hidden);
  const tabs: { id: Tab; label: string }[] = [
    ...(!menuHidden
      ? [{ id: "carte" as Tab, label: t("guest.tabMenu") }]
      : []),
    { id: "services", label: t("guest.tabService") },
    { id: "personnel", label: t("guest.tabStaff") },
  ];
  const activeTab =
    tab === "carte" && (menuHidden || tabs.every((x) => x.id !== "carte"))
      ? "services"
      : tab;

  return (
    <div className="space-y-6">
      <header className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
        <p className="text-xs font-medium text-zinc-500">{t("guest.eventLabel")}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
          {eventName}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-violet-100/80 px-3 py-1 text-xs font-medium text-zinc-800">
            {t("guest.tableBadge")} {tableNumber}
          </span>
          {locationDraft ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {locationDraft}
            </span>
          ) : null}
          {isVip ? (
            <span className="rounded-full bg-gradient-to-r from-amber-200 to-yellow-300 px-3 py-1 text-xs font-bold tracking-wide text-amber-950 shadow-sm ring-1 ring-amber-400/40">
              VIP
            </span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={clearTable}
          >
            {t("guest.changeTable")}
          </Button>
        </div>
        {feedback ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">{feedback}</p>
        ) : null}
        {retrying ? (
          <p className="mt-3 text-sm font-medium text-amber-800">
            {t("guest.retrying")}
          </p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </header>

      <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-4">
        <label className="block text-xs font-medium text-zinc-500">
          {t("guest.allergiesLabel")}
        </label>
        <Input
          className="mt-1.5"
          value={allergiesDraft}
          onChange={(e) => setAllergiesDraft(e.target.value)}
          placeholder={t("guest.allergiesPh")}
          autoComplete="off"
        />
        <p className="mt-1.5 text-[11px] text-zinc-400">
          {t("guest.allergiesHint")}
        </p>
      </div>

      <div className="flex gap-1 rounded-[1.35rem] border border-zinc-200 bg-zinc-50/80 p-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-[1.15rem] py-2.5 text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-white text-zinc-900"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "carte" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">{t("guest.menuTitle")}</h2>
          <ul className="space-y-3">
            {visibleMenu.length === 0 ? (
              <li className="rounded-[1.35rem] border border-zinc-100 bg-white px-4 py-6 text-center text-sm text-zinc-500">
                {t("guest.menuEmpty")}
              </li>
            ) : (
              visibleMenu.map((item) => (
                <li
                  key={item.id}
                  className="rounded-[1.35rem] border border-zinc-100 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">{item.name}</p>
                      {item.description ? (
                        <p className="mt-1 text-sm text-zinc-500">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    {item.outOfStock ? (
                      <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
                        {t("guest.outOfStock")}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 text-xs"
                        onClick={() => {
                          setSelectedProduct(item);
                          setProductNote("");
                        }}
                      >
                        {t("guest.order")}
                      </Button>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>

          {selectedProduct ? (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/30 p-4 sm:items-center">
              <div className="w-full max-w-md rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-none">
                <p className="text-sm font-semibold text-zinc-900">
                  {selectedProduct.name}
                </p>
                <label className="mt-3 block text-xs font-medium text-zinc-500">
                  {t("guest.precision")}
                </label>
                <Input
                  className="mt-1"
                  value={productNote}
                  onChange={(e) => setProductNote(e.target.value)}
                  placeholder={t("guest.precisionPh")}
                />
                <div className="mt-5 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setSelectedProduct(null)}
                  >
                    {t("guest.cancel")}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={pending}
                    onClick={() => {
                      if (!selectedProduct || !tableNumber) return;
                      const base = selectedProduct.name;
                      const msg = productNote.trim()
                        ? `${base} — ${productNote.trim()}`
                        : base;
                      send(
                        GUEST_REQUEST.PRODUCT,
                        msg,
                        REQUEST_CATEGORY.OTHER,
                      );
                    }}
                  >
                    {t("guest.send")}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "services" ? (
        <section className="rounded-[1.75rem] border border-zinc-100 bg-white px-4 py-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            {t("guest.serviceTitle")}
          </h2>

          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">
              {t("guest.categoryLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {REQUEST_CATEGORY_ORDER.map((cat) => {
                const styles = REQUEST_CATEGORY_STYLES[cat];
                const active = serviceCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setServiceCategory(cat)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active ? styles.chipActive : styles.chip
                    }`}
                  >
                    {categoryLabel(cat)}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-zinc-500">{t("guest.serviceSuggestions")}</p>
          <div className="flex flex-wrap gap-2">
            {serviceIdeas.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setServiceText((prev) => (prev ? `${prev}, ${s}` : s))
                }
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {s}
              </button>
            ))}
          </div>
          <Textarea
            value={serviceText}
            onChange={(e) => setServiceText(e.target.value)}
            placeholder={t("guest.servicePh")}
          />
          <Button
            type="button"
            className="w-full"
            disabled={pending || !serviceText.trim()}
            onClick={() =>
              send(
                GUEST_REQUEST.SERVICE,
                serviceText.trim(),
                serviceCategory,
              )
            }
          >
            {t("guest.sendRequest")}
          </Button>
        </section>
      ) : null}

      {activeTab === "personnel" ? (
        <section className="rounded-[1.75rem] border border-zinc-100 bg-white px-4 py-8 text-center space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">{t("guest.staffTitle")}</h2>
          <p className="text-sm text-zinc-500">
            {t("guest.staffBody").replace("{table}", tableNumber)}
          </p>
          <Button
            type="button"
            className="w-full max-w-xs"
            disabled={pending}
            onClick={() =>
              send(
                GUEST_REQUEST.STAFF,
                t("guest.staffMessage").replace("{table}", tableNumber),
                REQUEST_CATEGORY.ASSISTANCE,
              )
            }
          >
            {t("guest.staffButton")}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
