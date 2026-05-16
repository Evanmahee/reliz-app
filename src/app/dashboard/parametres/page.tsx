import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { PasswordChangeForm } from "@/components/dashboard/password-change-form";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
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
        <p className="text-xs font-medium text-zinc-400">
          Paramètres
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Compte
        </h1>
      </div>

      <Card className="space-y-3 px-5 py-6 sm:px-6">
        <h2 className="text-sm font-semibold text-zinc-900">Profil</h2>
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
            Se déconnecter
          </Button>
        </form>
      </Card>

      <Card className="px-5 py-6 sm:px-6">
        <h2 className="text-sm font-semibold text-zinc-900">
          Changer le mot de passe
        </h2>
        {sp.ok ? (
          <p className="mt-2 text-sm font-medium text-emerald-700">
            Mot de passe mis à jour.
          </p>
        ) : null}
        {sp.erreur === "actuel" ? (
          <p className="mt-2 text-sm text-red-600">
            Mot de passe actuel incorrect.
          </p>
        ) : null}
        {sp.erreur === "court" ? (
          <p className="mt-2 text-sm text-red-600">
            Le nouveau mot de passe doit contenir au moins 8 caractères.
          </p>
        ) : null}
        <PasswordChangeForm />
      </Card>

      <p className="text-center text-xs text-zinc-400">
        Compte démo : <span className="text-zinc-600">demo@reliz.app</span> /{" "}
        <span className="text-zinc-600">demo1234</span>
      </p>
    </div>
  );
}
