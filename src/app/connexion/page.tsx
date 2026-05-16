import { loginAction } from "@/app/actions/auth";
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
  } else if (sp.erreur === "serveur") {
    msg = t("connexion.errors.serveur");
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
            {msg ? (
              <p className="rounded-[1rem] bg-red-50 px-3 py-2 text-sm text-red-700">
                {msg}
              </p>
            ) : null}

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
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-zinc-700"
                >
                  {t("connexion.password")}
                </label>
                <span className="text-xs text-zinc-400">
                  {t("connexion.forgotPassword")}
                </span>
              </div>
              <PasswordField />
            </div>

            <Button type="submit" className="mt-2 w-full">
              {t("connexion.submit")}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500">
            {t("connexion.demo")}{" "}
            <span className="font-medium text-zinc-800">demo@reliz.app</span>
            {" / "}
            <span className="font-medium text-zinc-800">demo1234</span>
          </p>

          <p className="mt-6 text-center text-xs text-zinc-400">
            {t("connexion.guestScanHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
