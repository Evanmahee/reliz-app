import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, outlineButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateLocaleTag } from "@/i18n/date-locale";
import { getT } from "@/i18n/server";

export default async function ChecklistsPage() {
  const { t, locale } = await getT();
  const dateTag = dateLocaleTag(locale);
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const checklists = await prisma.checklist.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400">{t("checklists.listTag")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {t("checklists.listTitle")}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-500">{t("checklists.listSubtitle")}</p>
        </div>
        <Link href="/dashboard/checklists/nouveau">
          <Button>{t("checklists.new")}</Button>
        </Link>
      </div>

      <Card className="divide-y divide-zinc-100 overflow-hidden rounded-[1.35rem] border-zinc-200">
        {checklists.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            <p>{t("checklists.empty")}</p>
            <Link
              href="/dashboard/checklists/nouveau"
              className={`mt-4 inline-block ${outlineButtonClassName}`}
            >
              {t("checklists.createFirst")}
            </Link>
          </div>
        ) : (
          checklists.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboard/checklists/${c.id}`}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  {c.name}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {t("checklists.updated")}{" "}
                  {c.updatedAt.toLocaleString(dateTag, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/dashboard/checklists/${c.id}`}>
                  <Button variant="outline" className="text-xs">
                    {t("checklists.edit")}
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
