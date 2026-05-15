import { notFound } from "next/navigation";
import { GuestApp } from "@/components/guest/guest-app";
import { EVENT_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function GuestEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { publicSlug: slug },
    include: { menuItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!event) notFound();

  if (event.status !== EVENT_STATUS.LIVE) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-16">
        <div className="max-w-md rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-zinc-900">
            Événement terminé
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Cette page n’est plus disponible pour les invités.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 pb-20">
      <div className="mx-auto max-w-lg">
        <GuestApp
          publicSlug={event.publicSlug}
          eventName={event.name}
          menuItems={event.menuItems.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            outOfStock: m.outOfStock,
          }))}
        />
      </div>
    </div>
  );
}
