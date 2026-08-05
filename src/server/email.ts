import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY
// Resend's shared sandbox sender works without domain verification, but only
// delivers to the email address that owns the Resend account. For production,
// set EMAIL_FROM to an address on a domain you've verified in Resend.
const from = process.env.EMAIL_FROM || "UnSwap <onboarding@resend.dev>"

const resend = apiKey ? new Resend(apiKey) : null

export type SendEmailParams = {
  to: string | string[]
  subject: string
  html?: string
  text?: string
}

/*
 * Branded email shell — the editorial-luxury language of the app, rendered for
 * email clients: tables (Outlook ignores flex/grid), inline styles (no <style>
 * support in Gmail), a Georgia serif stack standing in for Cormorant (webfonts
 * are unreliable in mail), and a bulletproof table-based CTA button.
 */
const NAVY = "#0a0e1a"
const CREAM = "#f5f0e8"
const GOLD = "#c9a84c"
const GOLD_DEEP = "#9a7c2c"
const HAIR = "#e3d8b8"
const INK = "#2b3242"
const MUTED = "#6b7689"

const SERIF = "Georgia,'Times New Roman',Times,serif"
const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif"

/**
 * Wrap content in the branded UnSwap email shell.
 *
 * `preheader` is the grey preview line mail clients show beside the subject —
 * without it they scrape the first visible text, which is usually the wordmark.
 */
export function renderEmail(opts: {
  heading: string
  body: string // HTML (paragraphs)
  ctaLabel?: string
  ctaUrl?: string
  eyebrow?: string
  preheader?: string
  footnote?: string
}): string {
  const { heading, body, ctaLabel, ctaUrl, eyebrow, preheader, footnote } = opts

  // Bulletproof button: a single-cell table renders reliably everywhere.
  const cta =
    ctaLabel && ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 6px">
           <tr><td align="center" bgcolor="${GOLD}" style="background:${GOLD};">
             <a href="${ctaUrl}" style="display:inline-block;padding:15px 34px;font-family:${SANS};font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${NAVY};text-decoration:none;">${ctaLabel}</a>
           </td></tr>
         </table>`
      : ""

  const eyebrowRow = eyebrow
    ? `<p style="margin:0 0 14px;font-family:${SANS};font-size:11px;letter-spacing:0.26em;text-transform:uppercase;color:${GOLD_DEEP};">${eyebrow}</p>`
    : ""

  const footnoteRow = footnote
    ? `<p style="margin:22px 0 0;font-family:${SANS};font-size:12px;line-height:1.7;color:${MUTED};">${footnote}</p>`
    : ""

  // Hidden preview text, padded so clients don't pull body copy in after it.
  const preview = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}${"&#8199;&#65279;&#847; ".repeat(60)}</div>`
    : ""

  return `<!--[if mso]><style>body,table,td{font-family:Arial,sans-serif !important}</style><![endif]-->
${preview}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${HAIR};">

      <!-- Masthead -->
      <tr><td style="background:${NAVY};padding:26px 34px;">
        <span style="font-family:${SERIF};font-size:23px;font-weight:normal;letter-spacing:0.16em;color:#ffffff;">UnSwap</span>
      </td></tr>
      <tr><td style="height:2px;background:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr>

      <!-- Body -->
      <tr><td style="padding:38px 34px 34px;">
        ${eyebrowRow}
        <h1 style="margin:0 0 16px;font-family:${SERIF};font-size:30px;font-weight:normal;line-height:1.2;color:${NAVY};">${heading}</h1>
        <div style="font-family:${SANS};font-size:15px;line-height:1.75;color:${INK};">${body}</div>
        ${cta}
        ${footnoteRow}
      </td></tr>

      <!-- Footer -->
      <tr><td style="border-top:1px solid ${HAIR};padding:22px 34px 28px;background:${CREAM};">
        <p style="margin:0 0 8px;font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${GOLD_DEEP};">
          Enabling Mobility &middot; Empowering Community
        </p>
        <p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.7;color:${MUTED};">
          UnSwap is an independent, staff-led platform. It is not affiliated with, endorsed by, or formally
          connected to the United Nations, the World Bank Group, the International Monetary Fund, or any
          international organisation.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>`
}

/**
 * Send an email via Resend. If RESEND_API_KEY isn't configured, the message is
 * logged to the console instead (dev fallback) so flows don't break locally.
 * Returns true if the email was actually dispatched.
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, html, text } = params

  if (!resend) {
    console.log(
      `[EMAIL — not sent, RESEND_API_KEY missing]\nTo: ${Array.isArray(to) ? to.join(", ") : to}\n` +
      `Subject: ${subject}\n${text || html || ""}`
    )
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html: html ?? undefined,
      text: text ?? (html ? undefined : subject),
    } as any)

    if (error) {
      console.error("Resend email error:", error)
      return false
    }
    return true
  } catch (err) {
    console.error("Failed to send email:", err)
    return false
  }
}
