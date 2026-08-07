import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { grantCreditsOnce } from "@/server/services/credits"
import { sendEmail, renderEmail, esc } from "@/server/email"

const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"
const loginUrl = () => `${baseUrl()}/login`

/** All submissions in the verification queue, newest first. */
export function listQueue(status: string = "PENDING") {
  return prisma.verificationSubmission.findMany({
    where: status === "ALL" ? {} : { status },
    include: { member: true, reviewer: true },
    orderBy: { createdAt: "desc" },
  })
}

/** Approve a submission: member becomes FULLY_VERIFIED and is notified. */
export async function approveSubmission(input: { actorId: string; id: string; note?: string }) {
  const submission = await prisma.verificationSubmission.findUnique({
    where: { id: input.id },
    include: { member: true },
  })
  if (!submission) throw new ApiError(404, "Submission not found.")
  if (submission.status !== "PENDING") throw new ApiError(409, "This submission has already been reviewed.")

  await prisma.$transaction([
    prisma.verificationSubmission.update({
      where: { id: input.id },
      data: { status: "APPROVED", reviewNote: input.note, reviewerId: input.actorId, reviewedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: submission.memberId },
      data: { verificationStatus: "FULLY_VERIFIED" },
    }),
  ])

  const emailSent = await sendEmail({
    to: submission.member.email,
    subject: "You're verified on UnSwap",
    html: renderEmail({
      heading: `Welcome to the network, ${esc(submission.member.firstName)}.`,
      preheader: "Your professional status has been verified.",
      body: `<p style="margin:0 0 14px">Your professional status has been verified. You now have full access to browse listings, list your home, and arrange exchanges with vetted peers.</p>
             <p style="margin:0">Two credits have been added to your balance to get you started.</p>`,
      ctaLabel: "Sign in to UnSwap",
      ctaUrl: loginUrl(),
    }),
  })

  // Reward reaching full verification — once per member.
  await grantCreditsOnce(submission.memberId, "verified")

  await logAudit({
    actorId: input.actorId,
    action: "MEMBER_VERIFIED",
    subject: `Verified member: ${submission.member.fullName}`,
    metadata: { email: submission.member.email },
  })

  return { emailWarning: emailSent ? undefined : `Member verified, but the email to ${submission.member.email} could not be sent.` }
}

/** Reject a submission with a required note; member status becomes REJECTED. */
export async function rejectSubmission(input: { actorId: string; id: string; note?: string }) {
  // The note is emailed to the member as their reason, so require a real
  // sentence (kept in sync with the client's MIN_NOTE).
  if (!input.note || input.note.trim().length < 10) {
    throw new ApiError(400, "A rejection reason of at least 10 characters is required so the member understands why.")
  }

  const submission = await prisma.verificationSubmission.findUnique({
    where: { id: input.id },
    include: { member: true },
  })
  if (!submission) throw new ApiError(404, "Submission not found.")
  if (submission.status !== "PENDING") throw new ApiError(409, "This submission has already been reviewed.")

  await prisma.$transaction([
    prisma.verificationSubmission.update({
      where: { id: input.id },
      data: { status: "REJECTED", reviewNote: input.note, reviewerId: input.actorId, reviewedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: submission.memberId },
      data: { verificationStatus: "REJECTED" },
    }),
  ])

  await sendEmail({
    to: submission.member.email,
    subject: "Your UnSwap verification needs attention",
    html: renderEmail({
      heading: `Hello ${esc(submission.member.firstName)},`,
      preheader: "We could not verify your submission this time.",
      // Quoted plainly rather than boxed: a rejection should read as a note
      // from a person, not a system notice.
      body: `<p style="margin:0 0 16px">We were unable to verify your submission this time.</p>
             <p style="margin:0 0 16px;padding-left:16px;border-left:2px solid #e3d8b8;color:#2b3242;">${esc(input.note)}</p>
             <p style="margin:0">You are welcome to resubmit with updated documentation whenever you are ready.</p>`,
      ctaLabel: "Resubmit documents",
      ctaUrl: `${baseUrl()}/verify-identity`,
    }),
  })

  await logAudit({
    actorId: input.actorId,
    action: "MEMBER_REJECTED",
    subject: `Rejected member: ${submission.member.fullName}`,
    metadata: { email: submission.member.email, note: input.note },
  })

  return { ok: true }
}
