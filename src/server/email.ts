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
