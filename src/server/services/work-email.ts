import { randomBytes } from "crypto"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { sendEmail, renderEmail, esc } from "@/server/email"
import { logAudit } from "@/server/services/audit"
import { rateLimit } from "@/server/rate-limit"
import { matchAllowedDomain, grantAutoVerifyRewards } from "@/server/services/registration"
import { emailSchema } from "@/lib/validation/auth"

const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"
const token = () => randomBytes(32).toString("hex")

/**
 * Start verification of a secondary, institutional email. This is the "add a
 * work email" path for members who signed up with a non-recognised address: we
 * only accept an address whose domain is on the allowlist, then email that
 * address a confirmation link. Confirming it (confirmWorkEmail) applies the same
 * auto-verify / fast-track outcome the primary email would have.
 */
export async function requestWorkEmailVerification(userId: string, rawEmail: string) {
  const parsed = emailSchema.safeParse(rawEmail)
  if (!parsed.success) throw new ApiError(400, "Enter a valid email address.")
  const email = parsed.data.trim().toLowerCase()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError(404, "Account not found.")
  if (user.verificationStatus === "FULLY_VERIFIED") {
    throw new ApiError(409, "You're already fully verified.")
  }
  if (email === user.email.toLowerCase()) {
    throw new ApiError(400, "That's already your account email. Add a different institutional address.")
  }

  // Only recognised institutional domains carry any weight — reject others up
  // front so we never email an address that can't help them verify.
  const matched = await matchAllowedDomain(email)
  if (!matched) {
    throw new ApiError(400, "We don't recognise that email domain. Use your institutional address, or upload your documents below.")
  }

  // A work address can back at most one account (primary or work email elsewhere).
  const other = await prisma.user.findFirst({
    where: { OR: [{ email }, { workEmail: email }], NOT: { id: userId } },
    select: { id: true },
  })
  if (other) throw new ApiError(409, "That email is already linked to another account.")

  // Authenticated, but it still dispatches mail to an address the user typed —
  // cap it so a signed-in member can't loop it to bomb an inbox.
  const limit = await rateLimit(`workemail:${userId}`, 5, 60 * 60)
  if (!limit.ok) throw new ApiError(429, "Too many attempts. Please try again later.")

  // One live link at a time.
  await prisma.workEmailToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  })

  const t = token()
  await prisma.workEmailToken.create({
    data: { token: t, userId, email, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  })

  const verifyUrl = `${baseUrl()}/verify-work?token=${t}`
  const instant = matched.autoVerify
  await sendEmail({
    to: email,
    subject: "Confirm your institutional email on UnSwap",
    html: renderEmail({
      heading: `Confirm your work email, ${esc(user.firstName)}.`,
      preheader: "Confirm this institutional address to verify your professional status.",
      body: `<p style="margin:0 0 14px">You're adding <strong>${esc(email)}</strong> to your UnSwap account to confirm your professional status with ${esc(matched.label)}.</p>
             <p style="margin:0">Confirm it to ${instant ? "complete your verification instantly." : "move to fast-track review."}</p>`,
      ctaLabel: "Confirm this email",
      ctaUrl: verifyUrl,
      footnote: "This link expires in 24 hours. If you did not request this, you can safely ignore this email.",
    }),
    text: `Confirm your institutional email (${email}) on UnSwap: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  })

  return { ok: true, email, instant }
}

export type WorkEmailOutcome = "verified" | "fast_track"

/**
 * Confirm an added institutional email. Records it on the account and applies
 * the domain's outcome: auto-verify domains land the member FULLY_VERIFIED on
 * the spot (with the same reward a human approval gives); other allowlisted
 * domains move them to fast-track document review.
 */
export async function confirmWorkEmail(rawToken: string): Promise<{ firstName: string; email: string; outcome: WorkEmailOutcome }> {
  if (!rawToken) throw new ApiError(400, "Missing confirmation token.")

  const record = await prisma.workEmailToken.findUnique({
    where: { token: rawToken },
    include: { user: true },
  })
  if (!record) throw new ApiError(400, "This confirmation link is invalid.")
  if (record.usedAt) throw new ApiError(410, "This confirmation link has already been used.")
  if (record.expiresAt < new Date()) throw new ApiError(410, "This confirmation link has expired.")

  // Re-check the allowlist at confirm time (the list can change between request
  // and click), and re-check the address is still free.
  const matched = await matchAllowedDomain(record.email)
  if (!matched) {
    await prisma.workEmailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
    throw new ApiError(400, "That email domain is no longer recognised.")
  }
  const taken = await prisma.user.findFirst({
    where: { workEmail: record.email, NOT: { id: record.userId } },
    select: { id: true },
  })
  if (taken) {
    await prisma.workEmailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
    throw new ApiError(409, "That email is already linked to another account.")
  }

  const alreadyVerified = record.user.verificationStatus === "FULLY_VERIFIED"
  // Only actually elevate (and reward) when this is a real transition on an
  // auto-verify domain. An already-verified member just gets the work email
  // recorded; a fast-track domain records it and routes to document review.
  const elevate = matched.autoVerify && !alreadyVerified

  await prisma.$transaction([
    prisma.workEmailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({
      where: { id: record.userId },
      data: {
        workEmail: record.email,
        workEmailVerifiedAt: new Date(),
        ...(elevate ? { verificationStatus: "FULLY_VERIFIED" } : {}),
      },
    }),
  ])

  if (elevate) {
    await grantAutoVerifyRewards({ id: record.userId, fullName: record.user.fullName, email: record.email })
  }

  await logAudit({
    action: "WORK_EMAIL_CONFIRMED",
    subject: `Work email confirmed for ${record.user.fullName}`,
    metadata: { email: record.email, elevated: elevate },
  })

  // "verified" whenever the member ends up fully verified (newly or already);
  // "fast_track" when an allowlisted-but-not-auto domain still needs documents.
  const outcome: WorkEmailOutcome = matched.autoVerify || alreadyVerified ? "verified" : "fast_track"
  return { firstName: record.user.firstName, email: record.email, outcome }
}
