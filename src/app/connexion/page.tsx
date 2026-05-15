import { loginAction } from "@/app/actions/auth";
import { LoginShowcase } from "@/components/auth/login-showcase";
import { PasswordField } from "@/components/auth/password-field";
import { RelizLogo } from "@/components/brand/reliz-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  let msg: string | null = null;
  if (sp.erreur === "identifiants") {
    msg = "Email ou mot de passe incorrect.";
  } else if (sp.erreur === "champs") {
    msg = "Merci de remplir tous les champs.";
  } else if (sp.erreur === "config") {
    msg =
      "Variables manquantes sur Vercel : ajoutez AUTH_SECRET et DATABASE_URL (voir .env.example).";
  } else if (sp.erreur === "db") {
    msg =
      "La base de données est injoignable ou renvoie une erreur (migrations manquantes, URL incorrecte, timeout…). Sur Supabase → Connect, privilégiez le Session pooler (port 5432). Vérifiez aussi que les tables existent (script SQL initial).";
  } else if (sp.erreur === "session") {
    msg =
      "Impossible d’enregistrer la session (JWT ou cookie). Vérifiez AUTH_SECRET (sans guillemets parasites), les logs serveur, et en prod sur HTTP mettez NEXT_PUBLIC_APP_URL en https ou COOKIE_SECURE=0.";
  } else if (sp.erreur === "serveur") {
    msg =
      "Erreur serveur inattendue. Consultez les logs Vercel ou réessayez plus tard.";
  }

  return (
    <div className="flex min-h-screen">
      <LoginShowcase />

      <div className="flex min-h-screen w-full flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:w-1/2 lg:max-w-none lg:px-16 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <RelizLogo height={32} priority />
          <p className="mt-2 text-[10px] font-medium tracking-[0.18em] text-zinc-400 uppercase">
            Événements & service en salle
          </p>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-900">
            Connectez-vous pour continuer
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
                Email
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
                  Mot de passe
                </label>
                <span className="text-xs text-zinc-400">
                  Mot de passe oublié ?
                </span>
              </div>
              <PasswordField />
            </div>

            <Button type="submit" className="mt-2 w-full">
              Se connecter
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Compte démo :{" "}
            <span className="font-medium text-zinc-800">demo@reliz.app</span>
            {" / "}
            <span className="font-medium text-zinc-800">demo1234</span>
          </p>

          <p className="mt-6 text-center text-xs text-zinc-400">
            Interface invités : scan du QR code sur place.
          </p>
        </div>
      </div>
    </div>
  );
}
