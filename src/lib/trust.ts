// Trust Score v1 — a transparent 0–100 composite that blends the three signals
// the trust-architecture pipeline names: verification depth, referral
// provenance, and platform history. Pure and deterministic (no ML, no hidden
// state) so the same inputs always yield the same score and the breakdown can
// be shown to the member. The server assembles the inputs from the database.

export type VerificationDepth = "institutional" | "document" | "email" | "none" | "suspended"
export type ReferralProvenance = "verified_referrer" | "referrer" | "organic"
export type TrustBand = "new" | "building" | "established" | "trusted"

export type TrustInputs = {
  verification: VerificationDepth
  referral: ReferralProvenance
  accountAgeDays: number
  completedSwaps: number
  reviewAverage: number | null // mean of 1–5 host reviews, or null when none yet
  reviewCount: number
  upheldReports: number // reserved for a moderation signal; pass 0 in v1
}

export type TrustBreakdown = {
  score: number
  band: TrustBand
  parts: { verification: number; referral: number; history: number }
  detail: { age: number; swaps: number; reviews: number; reliability: number }
}

// Weights — the maxima sum to 100: verification 40, referral 20, history 40.
// Verification is the heaviest single signal because it's the network's premise.
const VERIFICATION_POINTS: Record<VerificationDepth, number> = {
  institutional: 40, // fully verified via an auto-verify institutional email
  document: 34, //      fully verified via reviewed documents
  email: 12, //         email confirmed only (browse-tier)
  none: 0,
  suspended: 0,
}
const REFERRAL_POINTS: Record<ReferralProvenance, number> = {
  verified_referrer: 20, // vouched for by a fully-verified member
  referrer: 12, //         referred, referrer not yet fully verified
  organic: 8, //           self-serve; a neutral baseline, not a penalty
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function computeTrustScore(i: TrustInputs): TrustBreakdown {
  const verification = VERIFICATION_POINTS[i.verification]
  const referral = REFERRAL_POINTS[i.referral]

  // History (max 40): tenure + completed exchanges + review quality + reliability.
  const age = clamp(Math.floor(i.accountAgeDays / 30) * 2, 0, 8) //          2/month, cap 8
  const swaps = clamp(i.completedSwaps * 5, 0, 15) //                        5 each, cap 15 (3 swaps)
  const reviews = i.reviewCount > 0 ? Math.round(((i.reviewAverage ?? 0) / 5) * 12) : 4 // neutral 4 until reviewed
  const reliability = clamp(5 - i.upheldReports * 5, 0, 5) //               clean = 5
  const history = age + swaps + reviews + reliability

  // A suspension zeroes the score outright — no other signal can offset it.
  const score = i.verification === "suspended" ? 0 : clamp(verification + referral + history, 0, 100)

  const band: TrustBand =
    score >= 75 ? "trusted" : score >= 50 ? "established" : score >= 25 ? "building" : "new"

  return { score, band, parts: { verification, referral, history }, detail: { age, swaps, reviews, reliability } }
}

// The autonomous gates the pipeline describes.
export const HIGH_VALUE_NIGHTLY = 200 //   listings at/above this are "higher-value"
export const MIN_SCORE_HIGH_VALUE = 50 //  trust needed to request them
export const MIN_SCORE_CONCIERGE = 70 //   trust needed for Relocation Concierge

export const canRequestHighValue = (score: number) => score >= MIN_SCORE_HIGH_VALUE
export const isConciergeEligible = (score: number) => score >= MIN_SCORE_CONCIERGE

export const BAND_LABEL: Record<TrustBand, string> = {
  new: "New",
  building: "Building",
  established: "Established",
  trusted: "Trusted",
}
