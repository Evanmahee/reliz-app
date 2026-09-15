/** URL invité avec préremplissage table / zone. */
export function buildTableGuestUrl(
  baseUrl: string,
  publicSlug: string,
  tableNumber: string,
  zone?: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const url = new URL(`${base}/e/${publicSlug}`);
  url.searchParams.set("table", tableNumber);
  const z = (zone ?? "").trim();
  if (z) url.searchParams.set("zone", z);
  return url.toString();
}

export function sortTablesByNumber<T extends { number: string }>(
  tables: T[],
): T[] {
  return tables
    .slice()
    .sort((a, b) =>
      a.number.localeCompare(b.number, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
}
