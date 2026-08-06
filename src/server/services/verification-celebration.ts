import { prisma } from "@/server/prisma"
import { CREDIT_GRANTS } from "@/server/services/credits"

/**
 * The "you are verified" moment.
 *
 * Full verification is the emotional peak of joining: it is the point at which
 * a closed, vetted network actually opens. Until now it landed as a silent
 * status change and an email.
 */
export type PendingVerification = {
  firstName: string
  credits: number
} | null

/**
 * Whether the member is newly verified and has not yet been congratulated.
 * Returns null once shown, so the moment happens exactly once.
 */
export async function getPendingVerification(userId: string): Promise<PendingVerification> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, verificationStatus: true, verifiedCelebratedAt: true },
  })
  if (!user || user.verificationStatus !== "FULLY_VERIFIED" || user.verifiedCelebratedAt) return null
  return { firstName: user.firstName, credits: CREDIT_GRANTS.verified.amount }
}

/**
 * Mark the moment as shown.
 *
 * Verification also grants credits, which would otherwise queue up a second
 * modal immediately behind this one. The credit shown inside this celebration
 * is the same one, so both markers move together and the member sees a single
 * coherent moment rather than two popups fighting for the same screen.
 */
export async function markVerificationCelebrated(userId: string) {
  const now = new Date()
  await prisma.user.update({
    where: { id: userId },
    data: { verifiedCelebratedAt: now, creditsCelebratedAt: now },
  })
}
