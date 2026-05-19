export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: string;
};

export function parseShoppingItems(raw: unknown): ShoppingListItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const name = String(o.name ?? "").trim();
      if (!name) return null;
      return {
        id: String(o.id ?? `item-${Date.now()}`),
        name,
        quantity: String(o.quantity ?? "").trim(),
      };
    })
    .filter((x): x is ShoppingListItem => x !== null);
}

export function formatShoppingListPlain(
  name: string,
  items: ShoppingListItem[],
): string {
  const lines = items.map((i) =>
    i.quantity ? `- ${i.name} (${i.quantity})` : `- ${i.name}`,
  );
  return `${name}\n\n${lines.join("\n")}`;
}
