import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { ConnexionErrorBanner } from "@/components/auth/connexion-error-banner";
import { LoginShowcase } from "@/components/auth/login-showcase";
import { PasswordField } from "@/components/auth/password-field";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { RelizLogo } from "@/components/brand/reliz-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getT } from "@/i18n/server";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { t } = await getT();
  const sp = await searchParams;

  // Ancien redirect « serveur » souvent obsolète (HMR) — on nettoie l’URL.
  if (sp.erreur === "serveur") {
    redirect("/connexion");
  }

  let msg: string | null = null;
  if (sp.erreur === "identifiants") {
    msg = t("connexion.errors.identifiants");
  } else if (sp.erreur === "champs") {
    msg = t("connexion.errors.champs");
  } else if (sp.erreur === "config") {
    msg = t("connexion.errors.config");
  } else if (sp.erreur === "db") {
    msg = t("connexion.errors.db");
  } else if (sp.erreur === "session") {
    msg = t("connexion.errors.session");
  }

  return (
    <div className="flex min-h-screen">
      <LoginShowcase />

      <div className="flex min-h-screen w-full flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:w-1/2 lg:max-w-none lg:px-16 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-start justify-between gap-3">
            <RelizLogo height={32} priority />
            <LocaleSwitcher returnTo="/connexion" />
          </div>
          <p className="mt-2 text-[10px] font-medium tracking-[0.18em] text-zinc-400 uppercase">
            {t("connexion.tagline")}
          </p>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-900">
            {t("connexion.title")}
          </h1>

          <form action={loginAction} className="mt-8 space-y-5">
            {msg ? <ConnexionErrorBanner message={msg} /> : null}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                {t("connexion.email")}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={t("connexion.emailPh")}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                {t("connexion.password")}
              </label>
              <PasswordField />
            </div>

            <Button type="submit" className="mt-2 w-full">
              {t("connexion.submit")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
