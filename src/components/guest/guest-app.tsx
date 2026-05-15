"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { submitGuestRequest } from "@/app/actions/guest";
import { GUEST_REQUEST } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  outOfStock: boolean;
};

type Tab = "carte" | "services" | "personnel";

const serviceIdeas = ["Verres", "Couverts", "Serviettes", "Eau", "Pain"];

export function GuestApp({
  publicSlug,
  eventName,
  menuItems,
}: {
  publicSlug: string;
  eventName: string;
  menuItems: MenuItem[];
}) {
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
      setError("Indiquez le numéro de votre table.");
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
        flash("Demande envoyée.");
        setProductNote("");
        setSelectedProduct(null);
        setServiceText("");
      });
    },
    [publicSlug, tableNumber],
  );

  if (!hydrated) {
    return (
      <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-10 text-center text-sm text-zinc-500">
        Chargement…
      </div>
    );
  }

  if (!tableNumber) {
    return (
      <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          {eventName}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Scannez le QR fourni par l’organisateur, puis indiquez votre numéro
          de table pour accéder au service.
        </p>
        <form onSubmit={saveTable} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Numéro de table
            </label>
            <Input
              inputMode="numeric"
              placeholder="Ex. 12"
              value={tableDraft}
              onChange={(e) => setTableDraft(e.target.value)}
              autoComplete="off"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full">
            Continuer
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
        <p className="text-xs font-medium text-zinc-500">
          Événement
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
          {eventName}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-violet-100/80 px-3 py-1 text-xs font-medium text-zinc-800">
            Table {tableNumber}
          </span>
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={clearTable}
          >
            Changer de table
          </Button>
        </div>
        {feedback ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">{feedback}</p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </header>

      <div className="flex gap-1 rounded-[1.35rem] border border-zinc-200 bg-zinc-50/80 p-1">
        {(
          [
            ["carte", "Carte"],
            ["services", "Services"],
            ["personnel", "À table"],
          ] as const
        ).map(([id, label]) => (
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
          <h2 className="text-sm font-semibold text-zinc-900">Carte</h2>
          <ul className="space-y-3">
            {menuItems.length === 0 ? (
              <li className="rounded-[1.35rem] border border-zinc-100 bg-white px-4 py-6 text-center text-sm text-zinc-500">
                La carte sera bientôt disponible.
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
                        Rupture de stock
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
                        Commander
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
                  Précision (optionnel)
                </label>
                <Input
                  className="mt-1"
                  value={productNote}
                  onChange={(e) => setProductNote(e.target.value)}
                  placeholder="Allergie, quantité…"
                />
                <div className="mt-5 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Annuler
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
                        flash("Demande envoyée.");
                        setProductNote("");
                        setSelectedProduct(null);
                      });
                    }}
                  >
                    Envoyer
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
            Demande de service
          </h2>
          <p className="text-xs text-zinc-500">Suggestions rapides :</p>
          <div className="flex flex-wrap gap-2">
            {serviceIdeas.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setServiceText((prev) =>
                    prev ? `${prev}, ${s}` : s,
                  )
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
            placeholder="Décrivez ce dont vous avez besoin…"
          />
          <Button
            type="button"
            className="w-full"
            disabled={pending || !serviceText.trim()}
            onClick={() =>
              send(GUEST_REQUEST.SERVICE, serviceText.trim())
            }
          >
            Envoyer la demande
          </Button>
        </section>
      ) : null}

      {tab === "personnel" ? (
        <section className="rounded-[1.75rem] border border-zinc-100 bg-white px-4 py-8 text-center space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            Besoin d’un membre de l’équipe ?
          </h2>
          <p className="text-sm text-zinc-500">
            Nous enverrons quelqu’un à la table {tableNumber}.
          </p>
          <Button
            type="button"
            className="w-full max-w-xs"
            disabled={pending}
            onClick={() =>
              send(
                GUEST_REQUEST.STAFF,
                `Intervention demandée à la table ${tableNumber}.`,
              )
            }
          >
            Appeler du personnel
          </Button>
        </section>
      ) : null}
    </div>
  );
}
