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

/**
 * Was this member vouched for, and by whom. Resolved as a durable User<->User
 * link: the member's `referredByCode` (stamped at registration) matched against
 * the referrer's own `referralCode`. No email join, no waitlist read, no
 * external call — so it can't drift when someone signs up with a different
 * address than they waitlisted with.
 */
async function referralProvenance(referredByCode: string | null): Promise<ReferralProvenance> {
  if (!referredByCode) return "organic"
  const referrer = await prisma.user.findUnique({
    where: { referralCode: referredByCode },
    select: { verificationStatus: true },
  })
  if (!referrer) return "referrer" // referred, but the referrer isn't a member yet
  return referrer.verificationStatus === "FULLY_VERIFIED" ? "verified_referrer" : "referrer"
}

/**
 * The member's live trust score with its full breakdown. Computed on demand from
 * current data, so it always reflects the latest verification, exchanges, and
 * reviews without a stored value to keep in sync.
 */
export async function getTrustScore(userId: string): Promise<TrustBreakdown> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, workEmail: true, verificationStatus: true, createdAt: true, trustScore: true, referredByCode: true },
  })
  if (!user) throw new ApiError(404, "User not found.")

  const [verification, referral, completedSwaps, reviewCount] = await Promise.all([
    verificationDepth(user),
    referralProvenance(user.referredByCode),
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
