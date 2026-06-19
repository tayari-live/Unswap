import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { sendEmail } from "@/server/email"

const loginUrl = () => `${process.env.AUTH_URL || "http://localhost:3000"}/login`

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
    html: `
      <h2>Welcome to the network, ${submission.member.firstName}.</h2>
      <p>Your professional status has been verified. You now have full access to browse
      listings, list your home, and arrange exchanges with vetted peers.</p>
      <p><a href="${loginUrl()}">Sign in to UnSwap</a></p>
    `,
  })

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
  if (!input.note || input.note.trim().length < 3) {
    throw new ApiError(400, "A rejection note is required so the member understands why.")
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
    html: `
      <h2>Hello ${submission.member.firstName},</h2>
      <p>We were unable to verify your submission at this time.</p>
      <p><strong>Reviewer note:</strong> ${input.note}</p>
      <p>You're welcome to resubmit with updated documentation.</p>
    `,
  })

  await logAudit({
    actorId: input.actorId,
    action: "MEMBER_REJECTED",
    subject: `Rejected member: ${submission.member.fullName}`,
    metadata: { email: submission.member.email, note: input.note },
  })

  return { ok: true }
}
