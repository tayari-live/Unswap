// Kit (formerly ConvertKit) integration for the waitlist double-opt-in.
//
// The confirmation email itself is a Kit *automation* (configured in the Kit
// dashboard) that fires when a subscriber is tagged. We push the subscriber
// with a `waitlist_token` custom field; the automation's email template builds
// the confirm link from it (…/api/waitlist/confirm?token={{waitlist_token}}).
//
// If the KIT_* env vars aren't set (e.g. local dev), every call becomes a
// logged no-op so the waitlist flow still works end-to-end without Kit.

const API = "https://api.kit.com/v4"

function creds() {
  const apiKey = process.env.KIT_API_KEY || process.env.KIT_API_SECRET
  const tagId = process.env.KIT_TAG_ID
  const formId = process.env.KIT_FORM_ID
  return { apiKey, tagId, formId }
}

export function kitConfigured() {
  const { apiKey, tagId } = creds()
  return !!(apiKey && tagId)
}

async function kitFetch(path: string, body: unknown) {
  const { apiKey } = creds()
  if (!apiKey) return { ok: false, skipped: true as const }
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kit-Api-Key": apiKey },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.warn(`[Kit] ${path} failed:`, await res.text().catch(() => res.status))
      return { ok: false as const }
    }
    return { ok: true as const }
  } catch (e) {
    console.warn(`[Kit] ${path} error:`, (e as Error).message)
    return { ok: false as const }
  }
}

/**
 * Upsert the subscriber with the confirmation token, then tag them to trigger
 * the Kit automation that emails the confirm link. Best-effort — returns
 * whether Kit actually handled it (false in dev without keys).
 */
export async function kitSendWaitlistConfirmation(input: { email: string; firstName: string; token: string }) {
  const { tagId } = creds()
  if (!kitConfigured()) {
    console.warn("[Kit] not configured — skipping confirmation email for", input.email)
    return { sent: false as const }
  }
  await kitFetch("/subscribers", {
    email_address: input.email,
    first_name: input.firstName,
    state: "active",
    fields: { waitlist_token: input.token },
  })
  const tagged = await kitFetch(`/tags/${tagId}/subscribers`, { email_address: input.email })
  return { sent: tagged.ok }
}

/** After confirmation, add the verified email to the Kit list/form. */
export async function kitAddToForm(email: string) {
  const { formId } = creds()
  if (!formId) return { ok: false as const }
  return kitFetch(`/forms/${formId}/subscribers`, { email_address: email })
}

/** Optional: mirror a referrer's verified-referral count into Kit for campaigns. */
export async function kitUpdateReferralCount(email: string, count: number) {
  if (!kitConfigured()) return { ok: false as const }
  return kitFetch("/subscribers", { email_address: email, fields: { referrals_count: count } })
}
