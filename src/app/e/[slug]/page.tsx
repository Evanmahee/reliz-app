import { notFound } from "next/navigation";
import { GuestApp } from "@/components/guest/guest-app";
import { GuestTopBar } from "@/components/guest/guest-top-bar";
import { EVENT_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getT } from "@/i18n/server";

export default async function GuestEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string; zone?: string }>;
}) {
  const { t } = await getT();
  const { slug } = await params;
  const sp = await searchParams;
  const tableParam = String(sp.table ?? "").trim();
  const zoneParam = String(sp.zone ?? "").trim();

  const event = await prisma.event.findUnique({
    where: { publicSlug: slug },
    include: { menuItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!event) notFound();

  let isVip = false;
  if (tableParam) {
    const table = await prisma.table.findFirst({
      where: { eventId: event.id, number: tableParam },
      select: { isVip: true, zone: true },
    });
    isVip = table?.isVip ?? false;
  }

  if (event.status !== EVENT_STATUS.LIVE) {
    return (
      <div className="min-h-screen bg-zinc-100 px-4 py-8">
        <GuestTopBar returnTo={`/e/${slug}`} />
        <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center">
          <div className="w-full rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-10 text-center">
            <p className="text-sm font-medium text-zinc-900">{t("guest.eventEnded")}</p>
            <p className="mt-2 text-sm text-zinc-500">{t("guest.eventEndedHint")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 pb-20">
      <GuestTopBar returnTo={`/e/${slug}`} />
      <div className="mx-auto max-w-lg">
        <GuestApp
          publicSlug={event.publicSlug}
          eventName={event.name}
          menuHidden={event.menuHidden}
          initialTableNumber={tableParam || undefined}
          initialTableLocation={zoneParam || undefined}
          isVip={isVip}
          menuItems={event.menuItems.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            outOfStock: m.outOfStock,
            hidden: m.hidden,
          }))}
        />
      </div>
    </div>
  );
}
