import { redirect } from "next/navigation";
import {
  changePasswordAction,
  signOutOtherSessionsAction,
  updateDisplayNameAction,
} from "@/app/actions/password";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSessionUserId } from "@/lib/auth";
import { getSessionUser } from "@/lib/event-access";
import { getT } from "@/i18n/server";

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const user = await getSessionUser(userId);
  if (!user) redirect("/connexion");
  const { t } = await getT();
  const sp = await searchParams;

  const okMsg: Record<string, string> = {
    nom: t("connexion.okNom"),
    motdepasse: t("connexion.okMotdepasse"),
    sessions: t("connexion.okSessions"),
  };
  const errMsg: Record<string, string> = {
    court: t("connexion.newTooShort"),
    long: t("connexion.errLong"),
    faible: t("connexion.errFaible"),
    email: t("connexion.errEmail"),
    different: t("connexion.newMismatch"),
    identique: t("connexion.errIdentique"),
    actuel: t("connexion.errActuel"),
    bloque: t("connexion.errBloque"),
    nom: t("connexion.errNom"),
    echec: t("connexion.newFailed"),
  };
  const ok = sp.ok ? okMsg[sp.ok] : null;
  const err = sp.erreur ? errMsg[sp.erreur] : null;
  const label = "mb-1.5 block text-sm font-medium text-zinc-700";

  return (
    <div className="w-full max-w-2xl space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("connexion.accountTitle")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
      </div>

      {ok ? (
        <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{ok}</p>
      ) : null}
      {err ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p>
      ) : null}

      <Card className="px-5 py-6 sm:px-6">
        <form action={updateDisplayNameAction} className="space-y-4">
          <div>
            <label htmlFor="name" className={label}>{t("connexion.accountName")}</label>
            <Input id="name" name="name" defaultValue={user.name ?? ""} maxLength={80} required />
          </div>
          <Button type="submit" variant="outline">{t("connexion.accountNameSave")}</Button>
        </form>
      </Card>

      <Card className="px-5 py-6 sm:px-6">
        <h2 className="text-base font-semibold text-zinc-900">{t("connexion.accountPwTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("connexion.accountPwHint")}</p>
        <form action={changePasswordAction} className="mt-5 space-y-4">
          <div>
            <label htmlFor="current" className={label}>{t("connexion.accountCurrent")}</label>
            <Input id="current" name="current" type="password" autoComplete="current-password" required />
          </div>
          <div>
            <label htmlFor="password" className={label}>{t("connexion.newPassword")}</label>
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required />
          </div>
          <div>
            <label htmlFor="confirm" className={label}>{t("connexion.newConfirm")}</label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} maxLength={72} required />
          </div>
          <Button type="submit">{t("connexion.accountPwSave")}</Button>
        </form>
      </Card>

      <Card className="px-5 py-6 sm:px-6">
        <h2 className="text-base font-semibold text-zinc-900">{t("connexion.accountSessionsTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("connexion.accountSessionsHint")}</p>
        <form action={signOutOtherSessionsAction} className="mt-4">
          <Button type="submit" variant="outline">{t("connexion.accountSessionsBtn")}</Button>
        </form>
      </Card>
    </div>
  );
}
