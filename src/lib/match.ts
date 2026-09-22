import { effectiveNightly } from "@/lib/valuation"
import { HIGH_VALUE_NIGHTLY, MIN_SCORE_HIGH_VALUE } from "@/lib/trust"

// Swap-matching engine — ranks candidate homes for a member from explainable
// signals: host trust, affordability against the member's points, destination
// affinity (places they've saved), and access (the trust gate on higher-value
// homes). Pure and deterministic so the same inputs always rank the same way
// and each match carries the reasons it surfaced.

export type MatchViewer = {
  trustScore: number
  pointsBalance: number
  // Lowercased city/country tokens from homes the member has saved.
  favouriteLocations: string[]
}

export type MatchListing = {
  city: string
  country: string
  exchangeType: string
  nightlyPoints: number
  nightlyAdjustment: number
  hasPhoto: boolean
  ownerVerified: boolean
  ownerTrust: number | null
}

export type MatchResult = {
  score: number
  reasons: string[]
  locked: boolean // higher-value home the member's trust can't yet request
  perNight: number
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function scoreMatch(viewer: MatchViewer, l: MatchListing): MatchResult {
  const perNight = effectiveNightly(l.nightlyPoints, l.nightlyAdjustment)
  const usesPoints = l.exchangeType !== "simultaneous"
  const reasons: string[] = []
  let score = 50

  // Access gate: a higher-value home the member can't yet request drops down
  // the ranking and is flagged, rather than hidden — it's an aspiration.
  const locked = usesPoints && perNight >= HIGH_VALUE_NIGHTLY && viewer.trustScore < MIN_SCORE_HIGH_VALUE
  if (locked) score -= 25

  // Destination affinity — the strongest personal signal we have.
  const city = l.city.toLowerCase()
  const country = l.country.toLowerCase()
  if (viewer.favouriteLocations.includes(city) || viewer.favouriteLocations.includes(country)) {
    score += 16
    reasons.push("Near homes you saved")
  }

  if (l.ownerVerified) {
    score += 15
    reasons.push("Verified host")
  }
  if (l.ownerTrust != null && l.ownerTrust >= 4.5) {
    score += 10
    reasons.push("Top-rated host")
  } else if (l.ownerTrust != null && l.ownerTrust >= 4) {
    score += 5
  }

  if (usesPoints) {
    if (viewer.pointsBalance >= perNight * 3) {
      score += 8
      reasons.push("Within your points")
    } else if (perNight <= 150) {
      score += 5
      reasons.push("Great value")
    }
  }

  if (l.hasPhoto) score += 3

  return { score: clamp(Math.round(score), 0, 100), reasons: reasons.slice(0, 3), locked, perNight }
}
