import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTabBar } from "@/components/dashboard/dashboard-tab-bar";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) redirect("/connexion");

  return (
    <div className="min-h-screen bg-zinc-100/80">
      <DashboardSidebar userName={user.name} userEmail={user.email} />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-60">
        <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
          <Link href="/dashboard" className="text-sm font-semibold">
            Reliz
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" className="text-xs">
              Déconnexion
            </Button>
          </form>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:px-8 lg:py-10 lg:pb-10">
          {children}
        </main>
      </div>
      <DashboardTabBar />
    </div>
  );
}
