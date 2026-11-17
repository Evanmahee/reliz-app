import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getAppBaseUrl } from "@/lib/app-url";
import { brandedEmail, mailerConfigured, sendMail } from "@/lib/mailer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Invitation d'un collaborateur :
 * 1. le traiteur crée le compte → statut « en attente d'activation » ;
 * 2. le collaborateur reçoit un lien signé, valable 72 h, à usage unique ;
 * 3. sur la page du lien, il reçoit un code à 6 chiffres par email ;
 * 4. code correct → compte activé, il peut se connecter.
 *
 * L'état est stocké dans app_metadata (Supabase Auth), modifiable uniquement
 * avec la clé service_role : impossible à trafiquer depuis le navigateur.
 */

const INVITE_TTL_MS = 72 * 60 * 60_000;

export type InviteMeta = {
  pending_activation?: boolean;
  invite_nonce?: string;
  invite_expires?: number;
};

function secret(): Buffer {
  const base =
    process.env.INVITE_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  if (!base) throw new Error("Secret d'invitation indisponible");
  return createHash("sha256").update(`reliz-invite:${base}`).digest();
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Jeton = userId.nonce.expiration.signature */
export function buildInviteToken(userId: string, nonce: string, expires: number): string {
  const payload = `${userId}.${nonce}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function parseInviteToken(
  token: string,
): { userId: string; nonce: string; expires: number } | null {
  const parts = token.split(".");
  if (parts.length !== 4 || token.length > 300) return null;
  const [userId, nonce, expiresRaw, sig] = parts;
  const expected = Buffer.from(sign(`${userId}.${nonce}.${expiresRaw}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;
  return { userId, nonce, expires };
}

/** Vérifie le jeton contre l'état actuel du compte (usage unique). */
export async function loadInvite(token: string) {
  const parsed = parseInviteToken(token);
  if (!parsed) return null;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(parsed.userId);
  if (error || !data.user?.email) return null;
  const meta = (data.user.app_metadata ?? {}) as InviteMeta;
  if (!meta.pending_activation || meta.invite_nonce !== parsed.nonce) return null;
  return { userId: parsed.userId, email: data.user.email, name: (data.user.user_metadata?.name as string) ?? "" };
}

/** Prépare un nouveau lien (l'ancien devient invalide) et envoie l'invitation. */
export async function sendStaffInvite(opts: {
  userId: string;
  email: string;
  name: string;
  ownerName: string;
}): Promise<boolean> {
  if (!mailerConfigured()) return false;
  const nonce = randomBytes(18).toString("base64url");
  const expires = Date.now() + INVITE_TTL_MS;
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(opts.userId, {
    app_metadata: { pending_activation: true, invite_nonce: nonce, invite_expires: expires },
  });
  if (error) {
    console.error("[sendStaffInvite]", error.message);
    return false;
  }
  const base = await getAppBaseUrl();
  const url = `${base}/activation?jeton=${encodeURIComponent(buildInviteToken(opts.userId, nonce, expires))}`;
  const first = opts.name.split(" ")[0] || opts.name;
  const mail = brandedEmail({
    title: `Bienvenue dans l’équipe, ${first}`,
    intro: `${opts.ownerName} vous a créé un accès à Reliz, l’outil de service en salle. Activez votre compte avec le bouton ci-dessous : nous vous enverrons ensuite un code de vérification par email.`,
    buttonLabel: "Activer mon compte",
    url,
    outro:
      "Ce lien est personnel, ne fonctionne qu’une fois et expire dans 72 heures. Vous ne connaissez pas cette personne ? Ignorez simplement cet email.",
  });
  return sendMail({ to: opts.email, subject: "Reliz — activez votre compte", ...mail });
}

/** Envoie le code à 6 chiffres (généré et vérifié par Supabase). */
export async function sendActivationCode(email: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const code = data?.properties?.email_otp;
  if (error || !code) {
    console.error("[sendActivationCode]", error?.message);
    return false;
  }
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f7f2ec;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#120c0a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:24px;padding:32px">
<tr><td><div style="font-size:20px;font-weight:700">reliz</div>
<p style="margin:24px 0 8px;font-size:15px;color:#5e4a3f">Votre code de vérification :</p>
<div style="font-size:34px;font-weight:700;letter-spacing:8px;margin:0 0 16px">${code}</div>
<p style="margin:0;font-size:13px;line-height:1.6;color:#8a776c">Saisissez-le sur la page d’activation. Il expire dans une heure. Ne le communiquez à personne, l’équipe Reliz ne vous le demandera jamais.</p>
</td></tr></table></td></tr></table></body></html>`;
  return sendMail({
    to: email,
    subject: `${code} est votre code Reliz`,
    html,
    text: `Votre code de vérification Reliz : ${code}\nIl expire dans une heure. Ne le communiquez à personne.`,
  });
}

/** Active le compte : l'invitation ne peut plus servir. */
export async function completeActivation(userId: string) {
  const admin = createSupabaseAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { pending_activation: false, invite_nonce: null, invite_expires: null },
  });
}
