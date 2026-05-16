"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { submitGuestRequest } from "@/app/actions/guest";
import { GUEST_REQUEST } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n/i18n-provider";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  outOfStock: boolean;
};

type Tab = "carte" | "services" | "personnel";

export function GuestApp({
  publicSlug,
  eventName,
  menuItems,
}: {
  publicSlug: string;
  eventName: string;
  menuItems: MenuItem[];
}) {
  const { t, messages } = useT();
  const serviceIdeas = messages.guest
    .serviceIdeas as unknown as readonly string[];

  const storageKey = `reliz_table_${publicSlug}`;
  const [hydrated, setHydrated] = useState(false);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [tableDraft, setTableDraft] = useState("");
  const [tab, setTab] = useState<Tab>("carte");
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [productNote, setProductNote] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [serviceText, setServiceText] = useState("");

  useEffect(() => {
    setTableNumber(sessionStorage.getItem(storageKey));
    setHydrated(true);
  }, [storageKey]);

  function saveTable(e: React.FormEvent) {
    e.preventDefault();
    const v = tableDraft.trim();
    if (!v) {
      setError(t("guest.tableError"));
      return;
    }
    sessionStorage.setItem(storageKey, v);
    setTableNumber(v);
    setTableDraft("");
    setError(null);
  }

  function clearTable() {
    sessionStorage.removeItem(storageKey);
    setTableNumber(null);
    setTab("carte");
  }

  function flash(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2400);
  }

  const send = useCallback(
    (type: string, message: string) => {
      if (!tableNumber) return;
      setError(null);
      start(async () => {
        const res = await submitGuestRequest({
          publicSlug,
          tableNumber,
          type,
          message,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        flash(t("guest.requestSent"));
        setProductNote("");
        setSelectedProduct(null);
        setServiceText("");
      });
    },
    [publicSlug, tableNumber, t],
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
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full">
            {t("guest.continue")}
          </Button>
        </form>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "carte", label: t("guest.tabMenu") },
    { id: "services", label: t("guest.tabService") },
    { id: "personnel", label: t("guest.tabStaff") },
  ];

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
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </header>

      <div className="flex gap-1 rounded-[1.35rem] border border-zinc-200 bg-zinc-50/80 p-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-[1.15rem] py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-white text-zinc-900"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "carte" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">{t("guest.menuTitle")}</h2>
          <ul className="space-y-3">
            {menuItems.length === 0 ? (
              <li className="rounded-[1.35rem] border border-zinc-100 bg-white px-4 py-6 text-center text-sm text-zinc-500">
                {t("guest.menuEmpty")}
              </li>
            ) : (
              menuItems.map((item) => (
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
                      setError(null);
                      start(async () => {
                        const res = await submitGuestRequest({
                          publicSlug,
                          tableNumber,
                          type: GUEST_REQUEST.PRODUCT,
                          message: msg,
                        });
                        if (!res.ok) {
                          setError(res.error);
                          return;
                        }
                        flash(t("guest.requestSent"));
                        setProductNote("");
                        setSelectedProduct(null);
                      });
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

      {tab === "services" ? (
        <section className="rounded-[1.75rem] border border-zinc-100 bg-white px-4 py-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            {t("guest.serviceTitle")}
          </h2>
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
            onClick={() => send(GUEST_REQUEST.SERVICE, serviceText.trim())}
          >
            {t("guest.sendRequest")}
          </Button>
        </section>
      ) : null}

      {tab === "personnel" ? (
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
