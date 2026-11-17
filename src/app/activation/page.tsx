import { requestActivationCodeAction, verifyActivationCodeAction } from "@/app/actions/activation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { loadInvite } from "@/lib/staff-invite";
import { getT } from "@/i18n/server";

/** Masque l'email : ca****@domaine.lu */
function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}${"•".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

export default async function ActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ jeton?: string; etape?: string; erreur?: string }>;
}) {
  const { t } = await getT();
  const sp = await searchParams;
  const jeton = (sp.jeton ?? "").slice(0, 300);
  const invite = jeton ? await loadInvite(jeton) : null;

  if (!invite) {
    return (
      <AuthCard title={t("activation.title")}>
        <p role="alert" className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {t("activation.badLink")}
        </p>
      </AuthCard>
    );
  }

  const first = invite.name.split(" ")[0] || "";
  const email = maskEmail(invite.email);
  const errors: Record<string, string> = {
    code: t("activation.badCode"),
    bloque: t("activation.blocked"),
    envoi: t("activation.sendFailed"),
  };
  const err = sp.erreur ? errors[sp.erreur] : null;
  const codeStep = sp.etape === "code";

  return (
    <AuthCard title={t("activation.title")}>
      <p className="mt-3 text-sm text-zinc-600">{t("activation.hello").replace("{name}", first)}</p>
      {err ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p>
      ) : null}

      {codeStep ? (
        <>
          <p className="mt-3 text-sm text-zinc-500">{t("activation.codeSent").replace("{email}", email)}</p>
          <form action={verifyActivationCodeAction} className="mt-6 space-y-4">
            <input type="hidden" name="jeton" value={jeton} />
            <label htmlFor="code" className="block text-sm font-medium text-zinc-700">
              {t("activation.codeLabel")}
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              maxLength={10}
              required
              autoFocus
              className="w-full rounded-2xl border-0 bg-cream px-4 py-4 text-center text-2xl font-semibold tracking-[0.5em] text-brand-950 ring-1 ring-brand-900/10 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button type="submit" className="w-full">{t("activation.verify")}</Button>
          </form>
          <form action={requestActivationCodeAction} className="mt-3">
            <input type="hidden" name="jeton" value={jeton} />
            <button type="submit" className="text-sm font-medium text-brand-700 hover:underline">
              {t("activation.resend")}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-zinc-500">{t("activation.intro").replace("{email}", email)}</p>
          <form action={requestActivationCodeAction} className="mt-6">
            <input type="hidden" name="jeton" value={jeton} />
            <Button type="submit" className="w-full">{t("activation.sendCode")}</Button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
