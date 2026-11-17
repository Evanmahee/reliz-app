/**
 * Envoi d'emails via Resend (même service et même domaine que le site Reliz).
 * Variables : RESEND_API_KEY, MAIL_FROM (ex. « Reliz <no-reply@reliz-rapisarda.com> »).
 */
const DEFAULT_FROM = "Reliz <no-reply@reliz-rapisarda.com>";

export function mailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM?.trim() || DEFAULT_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[mailer] Resend", res.status, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[mailer]", e);
    return false;
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Mise en page commune des emails Reliz. Fond clair, texte foncé, aucune
 * image ni dégradé : lisible tel quel en mode clair et correctement inversé
 * en mode sombre (Gmail, Apple Mail, Outlook).
 */
export function emailLayout(opts: { preheader: string; body: string; footer?: string }): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>Reliz</title></head>
<body style="margin:0;padding:0;background:#f7f2ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#120c0a">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ec"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 8px 16px"><span style="font-size:24px;font-weight:800;letter-spacing:-0.03em;color:#120c0a">reliz</span><span style="font-size:24px;font-weight:800;color:#c45c26">.</span></td></tr>
<tr><td style="background:#ffffff;border:1px solid #eadfd6;border-top:4px solid #c45c26;border-radius:20px;padding:32px">${opts.body}</td></tr>
<tr><td style="padding:16px 8px 0;font-size:12px;line-height:1.6;color:#8a776c">${opts.footer ?? "Reliz · Événements &amp; service en salle · Luxembourg"}</td></tr>
</table></td></tr></table></body></html>`;
}

/** Email avec un bouton (mot de passe oublié, invitation). */
export function brandedEmail(opts: {
  title: string;
  intro: string;
  buttonLabel: string;
  url: string;
  outro: string;
}): { html: string; text: string } {
  const body = `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#120c0a">${escapeHtml(opts.title)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a3a31">${escapeHtml(opts.intro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:12px;background:#c45c26">
<a href="${escapeHtml(opts.url)}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px">${escapeHtml(opts.buttonLabel)}</a>
</td></tr></table>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8a776c">${escapeHtml(opts.outro)}</p>`;
  const html = emailLayout({ preheader: opts.intro, body });
  const text = `${opts.title}\n\n${opts.intro}\n\n${opts.buttonLabel} : ${opts.url}\n\n${opts.outro}\n\nReliz`;
  return { html, text };
}

/** Email contenant un code à 6 chiffres. */
export function codeEmail(code: string): { html: string; text: string } {
  const safe = escapeHtml(code);
  const body = `<p style="margin:0 0 8px;font-size:15px;color:#4a3a31">Votre code de vérification :</p>
<p style="margin:0 0 20px;font-size:34px;font-weight:800;letter-spacing:8px;color:#120c0a">${safe}</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#8a776c">Saisissez-le sur la page d’activation. Il expire dans une heure. Ne le communiquez à personne : l’équipe Reliz ne vous le demandera jamais.</p>`;
  return {
    html: emailLayout({ preheader: `Votre code Reliz : ${code}`, body }),
    text: `Votre code de vérification Reliz : ${code}\nIl expire dans une heure. Ne le communiquez à personne.`,
  };
}
