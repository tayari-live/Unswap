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

/**
 * Wrap content in the branded UnSwap email shell (navy header, gold CTA).
 * Keeps all transactional emails visually consistent.
 */
export function renderEmail(opts: {
  heading: string
  body: string // HTML (paragraphs)
  ctaLabel?: string
  ctaUrl?: string
}): string {
  const { heading, body, ctaLabel, ctaUrl } = opts
  const cta =
    ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:20px;background:#9A7C2C;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:10px">${ctaLabel}</a>`
      : ""
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #E3E7EE;border-radius:16px;overflow:hidden">
    <div style="background:#0B1F3A;padding:20px 28px">
      <span style="color:#ffffff;font-size:22px;font-weight:bold;font-family:Georgia,'Times New Roman',serif">UnSwap</span>
    </div>
    <div style="padding:28px">
      <h1 style="color:#0B1F3A;font-size:20px;margin:0 0 14px;font-family:Georgia,'Times New Roman',serif">${heading}</h1>
      <div style="color:#3A4357;font-size:14px;line-height:1.65">${body}</div>
      ${cta}
      <p style="color:#6B7689;font-size:11px;margin-top:28px;border-top:1px solid #E3E7EE;padding-top:16px">
        UnSwap — Enabling Mobility. Empowering Community.<br/>
        An independent, staff-led platform, not affiliated with the United Nations.
      </p>
    </div>
  </div>`
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
