import { MailtrapClient } from "mailtrap"

const apiToken = process.env.MAILTRAP_TOKEN

/*
 * Sender address.
 *
 * Mailtrap verifies an exact domain, and ours is the mail.unswap.net
 * subdomain, not the apex. Sending from @unswap.net is rejected, and because a
 * failed send only returns false, the symptom is silent: the account is
 * created and no email arrives.
 *
 * The fallback therefore matches the verified subdomain rather than the apex,
 * and a missing EMAIL_FROM says so at boot instead of being discovered later
 * through mail that never turned up.
 */
const DEFAULT_FROM = "UnSwap <hello@mail.unswap.net>"
const fromRaw = process.env.EMAIL_FROM || DEFAULT_FROM

if (!process.env.EMAIL_FROM && process.env.NODE_ENV === "production") {
  console.warn(
    `EMAIL_FROM is not set. Falling back to ${DEFAULT_FROM}, which only sends ` +
    `if that exact domain is verified in Mailtrap.`,
  )
}

const client = apiToken ? new MailtrapClient({ token: apiToken }) : null

/**
 * Split an RFC-style sender ("UnSwap <hello@mail.unswap.net>") into the parts the
 * Mailtrap SDK expects. Kept so EMAIL_FROM stays in one familiar format rather
 * than becoming two environment variables.
 */
function sender(): { email: string; name?: string } {
  const m = fromRaw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (m) return { email: m[2]!.trim(), name: m[1]!.replace(/^"|"$/g, "").trim() || undefined }
  return { email: fromRaw.trim() }
}

/** Whether real sending is wired up. False in local dev without a token. */
export const emailConfigured = () => !!client

export type SendEmailParams = {
  to: string | string[]
  subject: string
  html?: string
  text?: string
}

/*
 * Email rendering constraints, which differ from the app's: tables rather than
 * flex or grid (Outlook ignores both), inline styles (Gmail strips <style>),
 * and a Georgia stack standing in for Cormorant, since webfonts are unreliable
 * in mail.
 */
const NAVY = "#0a0e1a"
const GOLD = "#c9a84c"
const GOLD_DEEP = "#9a7c2c"
const HAIR = "#e3d8b8"
const INK = "#2b3242"
const MUTED = "#6b7689"

const SERIF = "Georgia,'Times New Roman',Times,serif"
const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif"

// Absolute URL — mail clients have no page to resolve a relative path against.
// A dedicated 76px asset (2x the 38px display size) rather than the 500px site
// logo: 2.8 KB instead of 70 KB, which matters on mobile data.
const logoUrl = () => `${process.env.AUTH_URL || "http://localhost:3000"}/email/logo-76.png`

/**
 * Escape a value before interpolating it into email HTML.
 *
 * Names, organisations and reviewer notes are user-supplied, so anything
 * inlined into a template has to be escaped or a member could register as
 * `<a href="…">` and inject markup into mail we send on their behalf.
 * Lives here so every template reaches for the same helper.
 */
export const esc = (s: string | null | undefined) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  )

/**
 * Wrap content in the UnSwap email shell.
 *
 * Deliberately close to a plain letter: a small logo, ordinary paragraphs, and
 * a single branded button. Heavily designed transactional mail reads as a
 * broadcast rather than a message, and dense table markup scores worse with
 * spam filters — which this domain can least afford. Only the call to action
 * and the sign-off carry the brand.
 *
 * `preheader` is the grey preview line clients show beside the subject; without
 * it they scrape the first visible text.
 */
export function renderEmail(opts: {
  heading: string
  body: string // HTML (paragraphs)
  ctaLabel?: string
  ctaUrl?: string
  preheader?: string
  footnote?: string
}): string {
  const { heading, body, ctaLabel, ctaUrl, preheader, footnote } = opts

  // Bulletproof button: a single-cell table renders reliably everywhere. This
  // is the one piece of the message that is unmistakably UnSwap.
  const cta =
    ctaLabel && ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 4px;">
           <tr><td bgcolor="${GOLD}" style="background:${GOLD};">
             <a href="${ctaUrl}" style="display:inline-block;padding:14px 30px;font-family:${SANS};font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${NAVY};text-decoration:none;">${ctaLabel}</a>
           </td></tr>
         </table>
         <p style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${MUTED};">
           If the button does not work, paste this into your browser:<br/>
           <a href="${ctaUrl}" style="color:${GOLD_DEEP};text-decoration:underline;word-break:break-all;">${ctaUrl}</a>
         </p>`
      : ""

  const footnoteRow = footnote
    ? `<p style="margin:24px 0 0;font-family:${SANS};font-size:12px;line-height:1.7;color:${MUTED};">${footnote}</p>`
    : ""

  const preview = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}${"&#8199;&#65279;&#847; ".repeat(60)}</div>`
    : ""

  return `<!--[if mso]><style>body,table,td{font-family:Arial,sans-serif !important}</style><![endif]-->
${preview}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:#ffffff;margin:0;padding:0;border-collapse:collapse;">
  <tr><td align="center" style="padding:36px 20px 48px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:560px;max-width:100%;text-align:left;">

      <!-- Logo only. Most clients block remote images, so nothing here is
           load-bearing: the message reads perfectly without it. -->
      <tr><td style="padding-bottom:26px;">
        <img src="${logoUrl()}" width="38" height="38" alt="UnSwap"
             style="display:block;width:38px;height:38px;border:0;outline:none;text-decoration:none;" />
      </td></tr>

      <tr><td>
        <p style="margin:0 0 18px;font-family:${SERIF};font-size:20px;font-weight:normal;line-height:1.35;color:${NAVY};">${heading}</p>
        <div style="font-family:${SANS};font-size:15px;line-height:1.75;color:${INK};">${body}</div>
        ${cta}
        ${footnoteRow}
      </td></tr>

      <!-- Sign-off: the second and last place the brand appears. -->
      <tr><td style="padding-top:34px;">
        <div style="border-top:1px solid ${HAIR};padding-top:18px;">
          <p style="margin:0 0 6px;font-family:${SERIF};font-size:15px;letter-spacing:0.14em;color:${NAVY};">UnSwap</p>
          <p style="margin:0 0 10px;font-family:${SANS};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${GOLD_DEEP};">
            Enabling Mobility &middot; Empowering Community
          </p>
          <p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.7;color:${MUTED};">
            An independent, staff-led platform. Not affiliated with, endorsed by, or formally
            connected to the United Nations, the World Bank Group, the International Monetary
            Fund, or any international organisation.
          </p>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>`
}

/**
 * Send an email via Mailtrap. Without MAILTRAP_TOKEN the message is logged to
 * the console instead (dev fallback) so flows stay testable locally.
 * Returns true if the email was actually dispatched.
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, html, text } = params
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean)
  if (!recipients.length) return false

  if (!client) {
    console.log(
      `[EMAIL — not sent, MAILTRAP_TOKEN missing]\nTo: ${recipients.join(", ")}\n` +
      `Subject: ${subject}\n${text || html || ""}`
    )
    return false
  }

  try {
    await client.send({
      from: sender(),
      to: recipients.map((email) => ({ email })),
      subject,
      ...(html ? { html } : {}),
      // Always include a plain-text part. It is what clients that refuse HTML
      // fall back to, and its absence is itself a spam signal.
      text: text ?? (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : subject),
    })
    return true
  } catch (err) {
    // A failed send must never break the flow that triggered it — callers treat
    // the boolean as advisory.
    console.error("Mailtrap email error:", err)
    return false
  }
}
