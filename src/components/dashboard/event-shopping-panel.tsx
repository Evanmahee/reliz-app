"use client";

import { useMemo } from "react";
import { createEventShoppingListAction } from "@/app/actions/shopping";
import { ShoppingListEditor } from "@/components/dashboard/shopping-list-editor";
import type { ShoppingListItem } from "@/lib/shopping-items";
import { SubmitButton } from "@/components/ui/submit-button";
import { wrapFormActionWithToast } from "@/components/ui/form-action-toast";
import { useT } from "@/i18n/i18n-provider";

export type EventShoppingListData = {
  id: string;
  name: string;
  items: ShoppingListItem[];
  sentTo: string;
  sentAt: string | null;
};

export function EventShoppingPanel({
  eventId,
  shoppingList,
  archived,
}: {
  eventId: string;
  shoppingList: EventShoppingListData | null;
  archived: boolean;
}) {
  const { t } = useT();

  const createWrapped = useMemo(
    () =>
      wrapFormActionWithToast(createEventShoppingListAction, {
        success: t("events.toast.shoppingCreated"),
      }),
    [t],
  );

  if (!shoppingList) {
    if (archived) {
      return (
        <p className="mt-4 text-sm text-zinc-500">{t("events.shoppingEmptyArchived")}</p>
      );
    }
    return (
      <div className="mt-4">
        <p className="text-sm text-zinc-500">{t("events.shoppingEmpty")}</p>
        <form action={createWrapped} className="mt-4">
          <input type="hidden" name="eventId" value={eventId} />
          <SubmitButton pendingLabel={t("shopping.creating")}>
            {t("events.shoppingCreate")}
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <ShoppingListEditor
        listId={shoppingList.id}
        initialName={shoppingList.name}
        initialItems={shoppingList.items}
        initialSentTo={shoppingList.sentTo}
        sentAt={shoppingList.sentAt}
        readOnly={archived}
        embedded
      />
    </div>
  );
}
