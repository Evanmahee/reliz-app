import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from "@prisma/client/runtime/library";
import { logoutAction } from "@/app/actions/auth";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RelizLogo } from "@/components/brand/reliz-logo";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTabBar } from "@/components/dashboard/dashboard-tab-bar";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { Button } from "@/components/ui/button";
import { getLocaleSwitcherReturnTo } from "@/i18n/set-locale-action";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const { t } = await getT();
  const localeReturnTo = await getLocaleSwitcherReturnTo();

  let user: { email: string; name: string | null };
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (!row) redirect("/connexion");
    user = row;
  } catch (e) {
    console.error("[dashboard layout]", e);
    if (
      e instanceof PrismaClientInitializationError ||
      e instanceof PrismaClientKnownRequestError ||
      e instanceof PrismaClientUnknownRequestError
    ) {
      redirect("/connexion?erreur=db");
    }
    redirect("/connexion?erreur=serveur");
  }

  return (
    <div className="min-h-screen bg-zinc-100/80">
      <DashboardSidebar
        userName={user.name}
        userEmail={user.email}
        localeReturnTo={localeReturnTo}
      />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-60">
        <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
          <Link href="/dashboard" className="inline-flex items-center">
            <RelizLogo height={22} />
          </Link>
          <div className="flex items-center gap-2">
            <LocaleSwitcher returnTo={localeReturnTo} />
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" className="text-xs">
                {t("nav.logout")}
              </Button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:px-8 lg:py-10 lg:pb-10">
          {children}
        </main>
      </div>
      <DashboardTabBar />
    </div>
  );
}
