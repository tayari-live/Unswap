// Waitlister (waitlister.me) — mirror each app signup onto the hosted waitlist.
//
// Fail-safe: a logged no-op when WAITLISTER_* env vars are unset (local dev),
// junk/scanner addresses are filtered, and any network error is swallowed so a
// Waitlister outage can never break a signup. Signups are idempotent per email
// on Waitlister's side, so re-submitting the same address is safe.

import { isJunkEmail } from "@/server/email-hygiene"

const API = "https://waitlister.me/api/v1"

function creds() {
  return {
    apiKey: process.env.WAITLISTER_API_KEY,
    waitlistKey: process.env.WAITLISTER_WAITLIST_KEY,
  }
}

export function waitlisterConfigured() {
  const { apiKey, waitlistKey } = creds()
  return !!(apiKey && waitlistKey)
}

/**
 * Fetch a subscriber's live referral figures by email (or id). Returns null when
 * unconfigured, not found, or on any error, so callers can fall back cleanly.
 * Powers the share page: the referral engine's position and count come from here.
 */
export async function getWaitlisterSubscriber(emailOrId: string): Promise<{
  position?: number
  inflatedPosition?: number
  points?: number
  referralCode?: string
  referralCount?: number
} | null> {
  const { apiKey, waitlistKey } = creds()
  if (!apiKey || !waitlistKey || !emailOrId) return null
  try {
    const res = await fetch(`${API}/waitlist/${waitlistKey}/subscribers/${encodeURIComponent(emailOrId)}`, {
      headers: { "X-Api-Key": apiKey },
    })
    if (!res.ok) return null
    const d = (await res.json().catch(() => null)) as Record<string, unknown> | null
    if (!d) return null
    // The subscriber may be at the top level or nested under `subscriber`.
    const s = (d.subscriber as Record<string, unknown>) ?? d
    return {
      position: s.position as number | undefined,
      inflatedPosition: s.inflated_position as number | undefined,
      points: s.points as number | undefined,
      referralCode: s.referral_code as string | undefined,
      referralCount: s.referral_count as number | undefined,
    }
  } catch (e) {
    console.warn("[Waitlister] get subscriber error:", (e as Error).message)
    return null
  }
}

/**
 * Add a subscriber to the Waitlister list. `metadata` keys are stored as custom
 * fields on the subscriber. Returns { skipped } when unconfigured or filtered.
 */
export async function waitlisterAddSubscriber(input: {
  email: string
  name?: string
  referredBy?: string
  metadata?: Record<string, string>
}) {
  const { apiKey, waitlistKey } = creds()
  if (!apiKey || !waitlistKey) return { ok: false, skipped: true as const }
  if (isJunkEmail(input.email)) return { ok: false, skipped: true as const }

  try {
    const res = await fetch(`${API}/waitlist/${waitlistKey}/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify({
        email: input.email,
        ...(input.name ? { name: input.name } : {}),
        // Waitlister is the referral engine: forward the incoming referral code
        // so it scores the referrer and reorders positions.
        ...(input.referredBy ? { referred_by: input.referredBy } : {}),
        ...(input.metadata ?? {}),
      }),
    })
    if (!res.ok) {
      console.warn("[Waitlister] sign-up failed:", await res.text().catch(() => res.status))
      return { ok: false as const }
    }
    // Waitlister returns the subscriber's referral code and position — the
    // pieces the share page needs to show once Waitlister owns the loop.
    const data = (await res.json().catch(() => ({}))) as {
      position?: number
      referral_code?: string
      redirect_url?: string
    }
    return {
      ok: true as const,
      position: data.position,
      referralCode: data.referral_code,
      redirectUrl: data.redirect_url,
    }
  } catch (e) {
    console.warn("[Waitlister] sign-up error:", (e as Error).message)
    return { ok: false as const }
  }
}
