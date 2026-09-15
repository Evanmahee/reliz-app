import { REQUEST_CATEGORY } from "@/lib/constants";

export type RequestCategory =
  (typeof REQUEST_CATEGORY)[keyof typeof REQUEST_CATEGORY];

export const REQUEST_CATEGORY_ORDER = [
  REQUEST_CATEGORY.DRINK,
  REQUEST_CATEGORY.CLEAR,
  REQUEST_CATEGORY.ASSISTANCE,
  REQUEST_CATEGORY.URGENT,
  REQUEST_CATEGORY.MISC,
] as const satisfies readonly RequestCategory[];

export const REQUEST_CATEGORY_STYLES: Record<
  RequestCategory,
  { border: string; badge: string; chip: string; chipActive: string }
> = {
  DRINK: {
    border: "border-l-sky-500",
    badge: "bg-sky-100 text-sky-900",
    chip: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100",
    chipActive: "border-sky-600 bg-sky-600 text-white hover:bg-sky-600",
  },
  CLEAR: {
    border: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-900",
    chip: "border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100",
    chipActive:
      "border-orange-600 bg-orange-600 text-white hover:bg-orange-600",
  },
  ASSISTANCE: {
    border: "border-l-amber-400",
    badge: "bg-amber-100 text-amber-950",
    chip: "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
    chipActive: "border-amber-500 bg-amber-500 text-white hover:bg-amber-500",
  },
  URGENT: {
    border: "border-l-red-600",
    badge: "bg-red-100 text-red-900",
    chip: "border-red-200 bg-red-50 text-red-900 hover:bg-red-100",
    chipActive: "border-red-600 bg-red-600 text-white hover:bg-red-600",
  },
  MISC: {
    border: "border-l-zinc-400",
    badge: "bg-zinc-100 text-zinc-700",
    chip: "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100",
    chipActive: "border-zinc-700 bg-zinc-700 text-white hover:bg-zinc-700",
  },
  OTHER: {
    border: "border-l-zinc-300",
    badge: "bg-zinc-100 text-zinc-600",
    chip: "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100",
    chipActive: "border-zinc-500 bg-zinc-500 text-white hover:bg-zinc-500",
  },
};

export function normalizeRequestCategory(
  value: unknown,
): RequestCategory {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (
    raw === REQUEST_CATEGORY.DRINK ||
    raw === REQUEST_CATEGORY.CLEAR ||
    raw === REQUEST_CATEGORY.ASSISTANCE ||
    raw === REQUEST_CATEGORY.URGENT ||
    raw === REQUEST_CATEGORY.MISC ||
    raw === REQUEST_CATEGORY.OTHER
  ) {
    return raw;
  }
  return REQUEST_CATEGORY.OTHER;
}

export function requestCategoryLabelKey(category: RequestCategory): string {
  return `guest.categories.${category.toLowerCase()}`;
}
