import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { PasswordChangeForm } from "@/components/dashboard/password-change-form";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getT } from "@/i18n/server";

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { t } = await getT();
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) redirect("/connexion");
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <p className="text-xs font-medium text-zinc-400">{t("parametres.tag")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          {t("parametres.title")}
        </h1>
      </div>

      <Card className="space-y-3 px-5 py-6 sm:px-6">
        <h2 className="text-sm font-semibold text-zinc-900">{t("parametres.profile")}</h2>
        <p className="text-sm text-zinc-500">
          {user.name ? (
            <>
              <span className="font-medium text-zinc-800">{user.name}</span>
              <br />
            </>
          ) : null}
          {user.email}
        </p>
        <form action={logoutAction} className="pt-2">
          <Button type="submit" variant="outline">
            {t("parametres.logout")}
          </Button>
        </form>
      </Card>

      <Card className="px-5 py-6 sm:px-6">
        <h2 className="text-sm font-semibold text-zinc-900">
          {t("parametres.changePassword")}
        </h2>
        {sp.ok ? (
          <p className="mt-2 text-sm font-medium text-emerald-700">{t("parametres.updated")}</p>
        ) : null}
        {sp.erreur === "actuel" ? (
          <p className="mt-2 text-sm text-red-600">{t("parametres.errCurrent")}</p>
        ) : null}
        {sp.erreur === "court" ? (
          <p className="mt-2 text-sm text-red-600">{t("parametres.errShort")}</p>
        ) : null}
        <PasswordChangeForm />
      </Card>

      <p className="text-center text-xs text-zinc-400">
        {t("parametres.demoFooter")}{" "}
        <span className="text-zinc-600">demo@reliz.app</span> /{" "}
        <span className="text-zinc-600">demo1234</span>
      </p>
    </div>
  );
}
