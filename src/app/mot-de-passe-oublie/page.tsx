import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/password";
import { AuthCard } from "@/components/auth/auth-card";
import { Button, primaryButtonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getT } from "@/i18n/server";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ envoye?: string; erreur?: string }>;
}) {
  const { t } = await getT();
  const sp = await searchParams;

  return (
    <AuthCard title={t("connexion.forgotTitle")}>
      {sp.erreur === "lien" ? (
        // Lien expiré ou déjà utilisé : on n'enchaîne pas sur un formulaire,
        // la personne choisit elle-même de redemander un lien.
        <>
          <p role="alert" className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {t("connexion.forgotBadLink")}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/connexion" className={`${primaryButtonClassName} w-full justify-center`}>
              {t("connexion.forgotBack")}
            </Link>
            <Link
              href="/mot-de-passe-oublie"
              className="py-2 text-center text-sm font-medium text-brand-700 hover:underline"
            >
              {t("connexion.forgotNewLink")}
            </Link>
          </div>
        </>
      ) : sp.envoye ? (
        <p role="status" className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {t("connexion.forgotSent")}
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-zinc-500">{t("connexion.forgotIntro")}</p>
          <form action={requestPasswordResetAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700">
                {t("connexion.email")}
              </label>
              <Input id="email" name="email" type="email" autoComplete="email" required placeholder={t("connexion.emailPh")} />
            </div>
            <Button type="submit" className="w-full">
              {t("connexion.forgotSubmit")}
            </Button>
          </form>
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">{t("connexion.forgotSafety")}</p>
        </>
      )}
      {sp.erreur !== "lien" ? (
        <Link href="/connexion" className="mt-6 inline-block text-sm font-medium text-brand-700 hover:underline">
          {t("connexion.forgotBack")}
        </Link>
      ) : null}
    </AuthCard>
  );
}
