"use client";

import { useMemo, useState } from "react";
import type { IconType } from "react-icons";
import {
  MdCheck,
  MdOutlineAdminPanelSettings,
  MdOutlineAutorenew,
  MdOutlineEventBusy,
  MdOutlineRoomService,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { EventMultiSelect, type EventOption } from "@/components/dashboard/event-multi-select";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { wrapFormActionWithToast } from "@/components/ui/form-action-toast";
import { USER_ROLE } from "@/lib/constants";
import { checkPassword, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password-policy";
import { useT } from "@/i18n/i18n-provider";

/** Score 0 à 4, cohérent avec les règles appliquées côté serveur. */
function passwordScore(pw: string, email: string): number {
  if (pw.length < PASSWORD_MIN) return 0;
  if (checkPassword(pw, email)) return 1;
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
  let score = 2;
  if (pw.length >= 14 && kinds >= 3) score = 3;
  if (pw.length >= 16 && kinds === 4) score = 4;
  return score;
}

/** Mot de passe aléatoire lisible (sans 0/O, 1/l), 16 caractères. */
function generatePassword(): string {
  const sets = ["abcdefghijkmnpqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "-_!?#"];
  const all = sets.join("");
  const rnd = new Uint32Array(16);
  crypto.getRandomValues(rnd);
  const chars = Array.from(rnd, (n, i) => (i < 4 ? sets[i] : all)[n % (i < 4 ? sets[i].length : all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const BAR = ["bg-red-500", "bg-orange-500", "bg-amber-400", "bg-emerald-500", "bg-emerald-600"];

export function StaffCreateForm({
  events,
  createAction,
  onCancel,
  inviteByEmail,
}: {
  events: EventOption[];
  createAction: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  inviteByEmail: boolean;
}) {
  const { t } = useT();
  const [role, setRole] = useState<string>(USER_ROLE.STAFF);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const score = passwordScore(password, email);
  const createWrapped = useMemo(
    () => wrapFormActionWithToast(createAction, { success: t("equipe.toastCreated") }),
    [createAction, t],
  );

  const roles: { value: string; label: string; desc: string; icon: IconType }[] = [
    { value: USER_ROLE.STAFF, label: t("roles.STAFF"), desc: t("equipe.roleStaffDesc"), icon: MdOutlineRoomService },
    { value: USER_ROLE.MAITRE_HOTEL, label: t("roles.MAITRE_HOTEL"), desc: t("equipe.roleAdminDesc"), icon: MdOutlineAdminPanelSettings },
  ];
  const label = "mb-1.5 block text-xs font-medium text-zinc-500";

  return (
    <form action={createWrapped} className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="staff-first" className={label}>{t("equipe.firstNamePh")}</label>
          <Input id="staff-first" name="firstName" autoComplete="off" maxLength={60} required />
        </div>
        <div>
          <label htmlFor="staff-last" className={label}>{t("equipe.lastNamePh")}</label>
          <Input id="staff-last" name="lastName" autoComplete="off" maxLength={60} required />
        </div>
      </div>

      <div>
        <label htmlFor="staff-email" className={label}>{t("equipe.emailPh")}</label>
        <Input
          id="staff-email"
          name="email"
          type="email"
          autoComplete="off"
          maxLength={254}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="staff-password" className="text-xs font-medium text-zinc-500">
            {t("equipe.pwLabel")}
          </label>
          <button
            type="button"
            onClick={() => {
              setPassword(generatePassword());
              setVisible(true);
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
          >
            <MdOutlineAutorenew className="h-3.5 w-3.5" aria-hidden />
            {t("equipe.pwGenerate")}
          </button>
        </div>
        <div className="relative">
          <Input
            id="staff-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("equipe.pwHide") : t("equipe.pwShow")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
          >
            {visible ? <MdOutlineVisibilityOff className="h-5 w-5" /> : <MdOutlineVisibility className="h-5 w-5" />}
          </button>
        </div>
        {password ? (
          <div className="mt-2" aria-live="polite">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${i < Math.max(1, score) ? BAR[score] : "bg-zinc-200"}`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs font-medium text-zinc-600">{t(`equipe.pw${score}`)}</p>
          </div>
        ) : null}
        <p className="mt-1.5 text-xs text-zinc-500">{t("connexion.accountPwHint").split(".")[0]}.</p>
      </div>

      <fieldset>
        <legend className={label}>{t("equipe.roleLabel")}</legend>
        <input type="hidden" name="role" value={role} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup">
          {roles.map((r) => {
            const active = role === r.value;
            const Icon = r.icon;
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRole(r.value)}
                className={`relative flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition ${
                  active ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-brand-500 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-zinc-900">{r.label}</span>
                <span className="text-xs leading-snug text-zinc-500">{r.desc}</span>
                {active ? (
                  <MdCheck className="absolute right-3 top-3 h-5 w-5 text-brand-600" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      {role === USER_ROLE.STAFF ? (
        events.length > 0 ? (
          <fieldset className="rounded-2xl bg-zinc-50 p-3.5">
            <legend className="sr-only">{t("equipe.eventsAccess")}</legend>
            <p className="text-sm font-medium text-zinc-800">{t("equipe.eventsAccess")}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{t("equipe.eventsAccessHint")}</p>
            <div className="mt-3">
              <EventMultiSelect events={events} />
            </div>
          </fieldset>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-3.5">
            <MdOutlineEventBusy className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
            <div>
              <p className="text-sm font-medium text-zinc-800">{t("equipe.noEventsTitle")}</p>
              <p className="text-xs text-zinc-500">{t("equipe.noEventsHint")}</p>
            </div>
          </div>
        )
      ) : null}

      {inviteByEmail ? (
        <p className="rounded-2xl bg-brand-50 px-3.5 py-3 text-xs leading-relaxed text-brand-900">
          {t("equipe.inviteHint")}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("equipe.cancel")}
        </Button>
        <SubmitButton pendingLabel={t("equipe.creating")} disabled={score < 2}>
          {t("equipe.create")}
        </SubmitButton>
      </div>
    </form>
  );
}
