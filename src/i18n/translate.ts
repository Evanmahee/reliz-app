/** Lit une clé type `connexion.title` dans un arbre d’objets. */
export function translate(
  messages: Record<string, unknown>,
  path: string,
): string {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object") {
      return path;
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : path;
}
