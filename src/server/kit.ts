// Kit (formerly ConvertKit) — marketing only.
//
// Transactional mail, including the waitlist confirmation, is sent directly
// through Mailtrap in src/server/email.ts. Kit's job is the marketing list.
//
// Subscribers are added at waitlist signup (Option A) and then tagged at each
// milestone, so campaigns can segment on where a person is in the funnel:
//   waitlist-joined  -> signed up (may not have confirmed yet)
//   waitlist-confirmed -> clicked the confirm link
//   account-created  -> passwordless account made
//   home-listed      -> added their first property
//   subscribed       -> started a paid membership (wired when payments are on)
//   referrer         -> has at least one verified referral
// Build audiences from combinations, e.g. joined AND NOT confirmed = the
// "confirm your spot" nudge.
//
// If the KIT_* env vars aren't set (e.g. local dev), every call becomes a
// logged no-op so the waitlist flow still works end-to-end without Kit.

import { isJunkEmail } from "@/server/email-hygiene"

const API = "https://api.kit.com/v4"

function apiKey() {
  return process.env.KIT_API_KEY || process.env.KIT_API_SECRET
}

export function kitConfigured() {
  return !!apiKey()
}

async function kitFetch(path: string, body: unknown) {
  const key = apiKey()
  if (!key) return { ok: false, skipped: true as const }
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kit-Api-Key": key },
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
 * Create or update a subscriber (active, no Kit double opt-in email) and set
 * their first name and custom fields. Junk addresses are dropped here so no
 * caller has to remember the filter. Custom-field keys must already exist in
 * Kit (organisation, referred_by, referrals_count); unknown keys are ignored.
 */
export async function kitUpsertSubscriber(
  email: string,
  opts?: { firstName?: string; fields?: Record<string, string | number> },
) {
  if (isJunkEmail(email)) return { ok: false, skipped: true as const }
  const fields = opts?.fields
    ? Object.fromEntries(Object.entries(opts.fields).filter(([, v]) => v !== "" && v != null))
    : undefined
  return kitFetch("/subscribers", {
    email_address: email,
    ...(opts?.firstName ? { first_name: opts.firstName } : {}),
    ...(fields && Object.keys(fields).length ? { fields } : {}),
  })
}

/** Add a Kit tag to a subscriber by email (creates the subscriber if new). */
export async function kitTag(email: string, tagId: string | undefined) {
  if (!tagId) return { ok: false, skipped: true as const }
  if (isJunkEmail(email)) return { ok: false, skipped: true as const }
  return kitFetch(`/tags/${tagId}/subscribers`, { email_address: email })
}

// Named milestone tags. Create each tag in Kit, then put its id in the matching
// env var; any unset var makes that tag a no-op.
// Blanket source tag applied the moment anyone is added to Kit from the app, so
// every UnSwap subscriber is distinguishable from any other list.
export const kitTagUnswap = (email: string) => kitTag(email, process.env.KIT_TAG_UNSWAP)
export const kitTagJoined = (email: string) => kitTag(email, process.env.KIT_TAG_JOINED)
export const kitTagConfirmed = (email: string) => kitTag(email, process.env.KIT_TAG_CONFIRMED)
export const kitTagAccountCreated = (email: string) => kitTag(email, process.env.KIT_TAG_ACCOUNT_CREATED)
export const kitTagHomeListed = (email: string) => kitTag(email, process.env.KIT_TAG_HOME_LISTED)
export const kitTagSubscribed = (email: string) => kitTag(email, process.env.KIT_TAG_SUBSCRIBED)
export const kitTagReferrer = (email: string) => kitTag(email, process.env.KIT_TAG_REFERRER)

/** Mirror a referrer's verified-referral count into Kit for campaigns. */
export async function kitUpdateReferralCount(email: string, count: number) {
  return kitUpsertSubscriber(email, { fields: { referrals_count: count } })
}
