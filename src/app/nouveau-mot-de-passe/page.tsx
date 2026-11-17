import { redirect } from "next/navigation";
import { updatePasswordAction } from "@/app/actions/password";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSessionUserId } from "@/lib/auth";
import { getT } from "@/i18n/server";

export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  // Accessible seulement avec la session ouverte par le lien reçu par email.
  if (!(await getSessionUserId())) redirect("/mot-de-passe-oublie?erreur=lien");
  const { t } = await getT();
  const sp = await searchParams;
  const msg =
    sp.erreur === "court"
      ? t("connexion.newTooShort")
      : sp.erreur === "different"
        ? t("connexion.newMismatch")
        : sp.erreur === "echec"
          ? t("connexion.newFailed")
          : null;

  return (
    <AuthCard title={t("connexion.newTitle")}>
      <form action={updatePasswordAction} className="mt-6 space-y-4">
        {msg ? (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {msg}
          </p>
        ) : null}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700">
            {t("connexion.newPassword")}
          </label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-zinc-700">
            {t("connexion.newConfirm")}
          </label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <Button type="submit" className="w-full">
          {t("connexion.newSubmit")}
        </Button>
      </form>
    </AuthCard>
  );
}
