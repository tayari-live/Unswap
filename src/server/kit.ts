// Kit (formerly ConvertKit) — marketing only.
//
// Transactional mail, including the waitlist confirmation, is sent directly
// through Mailtrap in src/server/email.ts. Kit's job is the marketing list: it
// receives an address only once that address has confirmed, and mirrors
// referral counts so campaigns can segment on them.
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
