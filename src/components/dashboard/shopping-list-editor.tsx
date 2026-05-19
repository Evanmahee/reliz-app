"use client";

import { useMemo, useState } from "react";
import {
  deleteShoppingListAction,
  markShoppingListSentAction,
  updateShoppingListAction,
} from "@/app/actions/shopping";
import type { ShoppingListItem } from "@/lib/shopping-items";
import { formatShoppingListPlain } from "@/lib/shopping-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { wrapFormActionWithToast } from "@/components/ui/form-action-toast";
import { useT } from "@/i18n/i18n-provider";

export function ShoppingListEditor({
  listId,
  initialName,
  initialItems,
  initialSentTo,
  sentAt,
  readOnly = false,
  embedded = false,
}: {
  listId: string;
  initialName: string;
  initialItems: ShoppingListItem[];
  initialSentTo: string;
  sentAt: string | null;
  readOnly?: boolean;
  /** Intégré dans un onglet événement (masque la suppression). */
  embedded?: boolean;
}) {
  const { t } = useT();
  const [items, setItems] = useState<ShoppingListItem[]>(initialItems);
  const [name, setName] = useState(initialName);
  const [sentTo, setSentTo] = useState(initialSentTo);

  const saveWrapped = useMemo(
    () =>
      wrapFormActionWithToast(updateShoppingListAction, {
        success: t("shopping.toastSaved"),
      }),
    [t],
  );

  function addRow() {
    setItems((prev) => [
      ...prev,
      { id: `item-${Date.now()}`, name: "", quantity: "" },
    ]);
  }

  function updateRow(id: string, patch: Partial<ShoppingListItem>) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  const mailto = useMemo(() => {
    const body = encodeURIComponent(formatShoppingListPlain(name, items));
    const to = sentTo.trim() ? encodeURIComponent(sentTo.trim()) : "";
    return `mailto:${to}?subject=${encodeURIComponent(name)}&body=${body}`;
  }, [name, items, sentTo]);

  return (
    <div className="space-y-6">
      <form action={saveWrapped} className="space-y-4">
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            {t("shopping.name")}
          </label>
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500">{t("shopping.items")}</p>
          {items.map((row) => (
            <div key={row.id} className="flex gap-2">
              <Input
                value={row.name}
                onChange={(e) => updateRow(row.id, { name: e.target.value })}
                placeholder={t("shopping.itemPh")}
                className="flex-1"
                disabled={readOnly}
              />
              <Input
                value={row.quantity}
                onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                placeholder={t("shopping.qtyPh")}
                className="w-24"
                disabled={readOnly}
              />
              {!readOnly ? (
                <Button type="button" variant="ghost" onClick={() => removeRow(row.id)}>
                  ×
                </Button>
              ) : null}
            </div>
          ))}
          {!readOnly ? (
            <Button type="button" variant="outline" onClick={addRow}>
              {t("shopping.addRow")}
            </Button>
          ) : null}
        </div>
        {!readOnly ? (
          <SubmitButton pendingLabel={t("shopping.saving")}>{t("shopping.save")}</SubmitButton>
        ) : null}
      </form>

      {!readOnly ? (
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-900">{t("shopping.sendTitle")}</h3>
          <Input
            value={sentTo}
            onChange={(e) => setSentTo(e.target.value)}
            placeholder={t("shopping.emailPh")}
            type="email"
          />
          <div className="flex flex-wrap gap-2">
            <a href={mailto} className="inline-flex">
              <Button type="button" variant="primary">
                {t("shopping.sendEmail")}
              </Button>
            </a>
            <form
              action={wrapFormActionWithToast(markShoppingListSentAction, {
                success: t("shopping.toastSent"),
              })}
            >
              <input type="hidden" name="listId" value={listId} />
              <input type="hidden" name="sentTo" value={sentTo} />
              <SubmitButton variant="outline" pendingLabel="…">
                {t("shopping.markSent")}
              </SubmitButton>
            </form>
          </div>
          {sentAt ? (
            <p className="text-xs text-zinc-500">
              {t("shopping.sentOn")} {new Date(sentAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : sentAt ? (
        <p className="text-xs text-zinc-500">
          {t("shopping.sentOn")} {new Date(sentAt).toLocaleString()}
        </p>
      ) : null}

      {!readOnly && !embedded ? (
        <form action={deleteShoppingListAction}>
          <input type="hidden" name="listId" value={listId} />
          <SubmitButton variant="ghost" className="text-red-700" pendingLabel="…">
            {t("shopping.delete")}
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
