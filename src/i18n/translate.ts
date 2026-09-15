import fr from "@/i18n/messages/fr";

/** Lit une clé type `connexion.title` dans un arbre d’objets. Fallback FR si absente. */
export function translate(
  messages: Record<string, unknown>,
  path: string,
): string {
  const from = (tree: Record<string, unknown>): string | undefined => {
    const parts = path.split(".");
    let cur: unknown = tree;
    for (const p of parts) {
      if (cur === null || typeof cur !== "object") return undefined;
      cur = (cur as Record<string, unknown>)[p];
    }
    return typeof cur === "string" ? cur : undefined;
  };

  return (
    from(messages) ??
    from(fr as unknown as Record<string, unknown>) ??
    path
  );
}
