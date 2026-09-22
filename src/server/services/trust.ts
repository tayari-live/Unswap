import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { matchAllowedDomain } from "@/server/services/registration"
import {
  computeTrustScore,
  canRequestHighValue,
  isConciergeEligible,
  HIGH_VALUE_NIGHTLY,
  MIN_SCORE_HIGH_VALUE,
  type TrustBreakdown,
  type VerificationDepth,
  type ReferralProvenance,
} from "@/lib/trust"

/** How strongly a member is verified — the heaviest trust signal. */
async function verificationDepth(user: {
  email: string
  workEmail: string | null
  verificationStatus: string
}): Promise<VerificationDepth> {
  if (user.verificationStatus === "SUSPENDED") return "suspended"
  if (user.verificationStatus === "FULLY_VERIFIED") {
    // Institutional when a verified email (primary or added work email) sits on
    // an auto-verify domain; otherwise it was reviewed documents.
    const [primary, work] = await Promise.all([
      matchAllowedDomain(user.email),
      user.workEmail ? matchAllowedDomain(user.workEmail) : Promise.resolve(null),
    ])
    return primary?.autoVerify || work?.autoVerify ? "institutional" : "document"
  }
  if (user.verificationStatus === "EMAIL_VERIFIED") return "email"
  return "none"
}

/** Was this member vouched for, and by whom. Read from the waitlist referral chain. */
async function referralProvenance(email: string): Promise<ReferralProvenance> {
  const wl = await prisma.waitlistEntry.findUnique({ where: { email }, select: { referredBy: true } })
  if (!wl?.referredBy) return "organic"
  const referrer = await prisma.waitlistEntry.findUnique({
    where: { referralCode: wl.referredBy },
    select: { email: true },
  })
  if (!referrer) return "organic"
  const referrerUser = await prisma.user.findUnique({
    where: { email: referrer.email },
    select: { verificationStatus: true },
  })
  return referrerUser?.verificationStatus === "FULLY_VERIFIED" ? "verified_referrer" : "referrer"
}

/**
 * The member's live trust score with its full breakdown. Computed on demand from
 * current data, so it always reflects the latest verification, exchanges, and
 * reviews without a stored value to keep in sync.
 */
export async function getTrustScore(userId: string): Promise<TrustBreakdown> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, workEmail: true, verificationStatus: true, createdAt: true, trustScore: true },
  })
  if (!user) throw new ApiError(404, "User not found.")

  const [verification, referral, completedSwaps, reviewCount] = await Promise.all([
    verificationDepth(user),
    referralProvenance(user.email),
    prisma.swapRequest.count({ where: { status: "COMPLETED", OR: [{ requesterId: userId }, { hostId: userId }] } }),
    prisma.review.count({ where: { subjectId: userId } }),
  ])

  const accountAgeDays = Math.max(0, Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000))

  return computeTrustScore({
    verification,
    referral,
    accountAgeDays,
    completedSwaps,
    reviewAverage: user.trustScore,
    reviewCount,
    upheldReports: 0, // reserved for a moderation signal
  })
}

/**
 * Autonomous access gate: requesting a higher-value home requires a minimum
 * trust score. A no-op for ordinary listings. Throws 403 with a clear, member-
 * facing reason when the bar isn't met.
 */
export async function assertCanRequestListing(userId: string, perNight: number) {
  if (perNight < HIGH_VALUE_NIGHTLY) return
  const { score } = await getTrustScore(userId)
  if (!canRequestHighValue(score)) {
    throw new ApiError(
      403,
      `This is a higher-value home (${perNight} points/night). Your trust score is ${score}, and ${MIN_SCORE_HIGH_VALUE} is needed to request homes at this tier. Get fully verified or complete more exchanges to raise it.`,
    )
  }
}

/** Relocation Concierge eligibility — gated on the same score. */
export async function conciergeEligibility(userId: string) {
  const { score } = await getTrustScore(userId)
  return { eligible: isConciergeEligible(score), score }
}
