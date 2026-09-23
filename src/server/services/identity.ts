import type Stripe from "stripe"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { stripe } from "@/server/services/billing"
import { grantAutoVerifyRewards } from "@/server/services/registration"

const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"

/** Whether automated ID verification is available (Stripe configured). */
export const identityEnabled = () => !!stripe

/**
 * Start an automated ID check with Stripe Identity. Returns a hosted URL to
 * redirect the member to; Stripe collects the document + selfie and reports the
 * outcome back via webhook. We store only the session id — never the raw ID.
 */
export async function createIdentitySession(userId: string): Promise<{ url: string }> {
  if (!stripe) throw new ApiError(503, "Automated ID verification isn't configured yet.")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verificationStatus: true },
  })
  if (!user) throw new ApiError(404, "Account not found.")
  if (user.verificationStatus === "FULLY_VERIFIED") throw new ApiError(409, "You're already fully verified.")

  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: { userId },
    options: { document: { require_matching_selfie: true, require_live_capture: true } },
    return_url: `${baseUrl()}/verify-identity?idv=complete`,
  })

  await prisma.identityCheck.create({
    data: { memberId: userId, sessionId: session.id, provider: "stripe", status: "pending" },
  })
  await logAudit({ action: "IDENTITY_STARTED", subject: "Automated ID check started", metadata: { userId, sessionId: session.id } })

  if (!session.url) throw new ApiError(502, "Could not start the ID check. Please try again.")
  return { url: session.url }
}

/**
 * Apply a Stripe Identity webhook event. On `verified` the member becomes
 * FULLY_VERIFIED (with the same one-time reward other verification paths give);
 * other outcomes just record their status.
 */
export async function handleIdentityEvent(event: Stripe.Event) {
  const session = event.data.object as Stripe.Identity.VerificationSession
  const userId = (session.metadata as Record<string, string> | null)?.userId

  const statusByType: Record<string, string> = {
    "identity.verification_session.verified": "verified",
    "identity.verification_session.requires_input": "requires_input",
    "identity.verification_session.canceled": "canceled",
    "identity.verification_session.processing": "pending",
  }
  const status = statusByType[event.type]
  if (!status) return // not an event we act on

  await prisma.identityCheck.updateMany({
    where: { sessionId: session.id },
    data: { status, ...(status === "verified" ? { verifiedAt: new Date() } : {}) },
  })

  if (status !== "verified" || !userId) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true, verificationStatus: true },
  })
  if (!user || user.verificationStatus === "FULLY_VERIFIED") return

  await prisma.user.update({ where: { id: userId }, data: { verificationStatus: "FULLY_VERIFIED" } })
  await grantAutoVerifyRewards({ id: userId, fullName: user.fullName, email: user.email })
  await logAudit({
    action: "MEMBER_VERIFIED",
    subject: `ID verified (automated): ${user.fullName}`,
    metadata: { email: user.email, method: "stripe_identity", sessionId: session.id },
  })
}
