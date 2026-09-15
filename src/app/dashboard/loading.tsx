export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-zinc-200/80" />
        <div className="h-8 w-64 max-w-full rounded-xl bg-zinc-200/80" />
        <div className="h-4 w-80 max-w-full rounded-lg bg-zinc-200/60" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-2xl bg-zinc-200/70" />
        <div className="h-28 rounded-2xl bg-zinc-200/70" />
      </div>
      <div className="h-48 rounded-2xl bg-zinc-200/60" />
    </div>
  );
}
