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

/** Gabarit sobre aux couleurs Reliz (tables : compatible avec tous les clients mail). */
export function brandedEmail(opts: {
  title: string;
  intro: string;
  buttonLabel: string;
  url: string;
  outro: string;
}): { html: string; text: string } {
  const t = escapeHtml(opts.title);
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f7f2ec;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#120c0a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ec;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden">
<tr><td style="background:#2a1810;background-image:radial-gradient(ellipse at 15% 0%,#c45c26 0%,#6b2f14 40%,#2a1810 75%);padding:28px 32px">
<div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#ffffff">reliz</div>
<div style="margin-top:4px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.6)">Événements &amp; service en salle</div></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3">${t}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5e4a3f">${escapeHtml(opts.intro)}</p>
<a href="${escapeHtml(opts.url)}" style="display:inline-block;background:#120c0a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:14px">${escapeHtml(opts.buttonLabel)}</a>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8a776c">${escapeHtml(opts.outro)}</p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:11px;color:#a8968a">Reliz · Luxembourg</p>
</td></tr></table></body></html>`;
  const text = `${opts.title}\n\n${opts.intro}\n\n${opts.buttonLabel} : ${opts.url}\n\n${opts.outro}\n\nReliz`;
  return { html, text };
}
