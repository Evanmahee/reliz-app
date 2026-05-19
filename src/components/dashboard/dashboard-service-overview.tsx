import { GUEST_REQUEST } from "@/lib/constants";

export function DashboardServiceOverview({
  pendingTotal,
  productCount,
  serviceCount,
  staffCount,
  urgentCount,
  labels,
}: {
  pendingTotal: number;
  productCount: number;
  serviceCount: number;
  staffCount: number;
  urgentCount: number;
  labels: {
    pending: string;
    orders: string;
    service: string;
    staff: string;
    urgent: string;
  };
}) {
  if (pendingTotal === 0) return null;

  const chips = [
    {
      key: GUEST_REQUEST.PRODUCT,
      count: productCount,
      label: labels.orders,
      className: "bg-violet-50 text-violet-900",
    },
    {
      key: GUEST_REQUEST.SERVICE,
      count: serviceCount,
      label: labels.service,
      className: "bg-sky-50 text-sky-900",
    },
    {
      key: GUEST_REQUEST.STAFF,
      count: staffCount,
      label: labels.staff,
      className: "bg-rose-50 text-rose-900",
    },
  ].filter((c) => c.count > 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
        <p className="text-xs font-medium text-zinc-500">{labels.pending}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
          {pendingTotal}
        </p>
      </div>
      {chips.map((c) => (
        <div
          key={c.key}
          className={`rounded-2xl border border-zinc-200 px-4 py-3 ${c.className}`}
        >
          <p className="text-xs font-medium opacity-80">{c.label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{c.count}</p>
        </div>
      ))}
      {urgentCount > 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-red-800">{labels.urgent}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-red-900">
            {urgentCount}
          </p>
        </div>
      ) : null}
    </div>
  );
}
