import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100/90 px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-bold text-zinc-900 ring-1 ring-zinc-200">
          R
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
          Reliz
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Espace traiteur & équipe</p>
      </div>

      <Card className="w-full max-w-md px-6 py-8">
        <form action={loginAction} className="space-y-4">
          {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Email
            </label>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Mot de passe
            </label>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Se connecter
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-zinc-400">
          Interface invités : scan du QR code fourni sur place.
        </p>
      </Card>

      <p className="mt-8 text-center text-xs text-zinc-400">
        Pas encore de compte ? Utilisez le compte démo ou créez un utilisateur
        via{" "}
        <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-zinc-700">
          npm run db:seed
        </code>
        .
      </p>
    </div>
  );
}
