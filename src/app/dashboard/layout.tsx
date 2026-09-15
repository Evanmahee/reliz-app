import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from "@prisma/client/runtime/library";
import { logoutAction } from "@/app/actions/auth";
import { getSessionUserId } from "@/lib/auth";
import { getSessionUser } from "@/lib/event-access";
import { isNextRedirectError } from "@/lib/is-next-redirect-error";
import { RelizLogo } from "@/components/brand/reliz-logo";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTabBar } from "@/components/dashboard/dashboard-tab-bar";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { getT } from "@/i18n/server";
import { MdLogout } from "react-icons/md";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const { t } = await getT();
  let user: { email: string; name: string | null; role: string };
  try {
    const row = await getSessionUser(userId);
    if (!row) redirect("/connexion");
    user = row;
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
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
        userRole={user.role}
      />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-60">
        <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
          <Link href="/dashboard" className="inline-flex items-center">
            <RelizLogo height={22} />
          </Link>
          <div className="flex items-center gap-2">
            <LocaleSwitcher returnTo="/dashboard" variant="select" />
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label={t("nav.logout")}
                title={t("nav.logout")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[1.15rem] text-zinc-700 transition-colors hover:bg-zinc-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                <MdLogout size={22} aria-hidden />
              </button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-6 py-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:py-10 lg:pb-10">
          {children}
        </main>
      </div>
      <DashboardTabBar userRole={user.role} />
    </div>
  );
}
