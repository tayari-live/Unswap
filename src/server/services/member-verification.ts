import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { reviewTypeForEmail } from "@/server/services/registration"

// Accept reasonably-sized image data URLs only. Documents are stored inline as
// base64 data URLs (the app's established pattern) — no external bucket needed.
const MAX_DATA_URL_CHARS = 8_000_000 // ~6 MB encoded
const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp);base64,/

function assertImage(value: string | undefined, field: string): string | undefined {
  if (!value) return undefined
  if (!IMAGE_DATA_URL.test(value)) {
    throw new ApiError(400, `${field} must be a PNG, JPG, or WebP image.`)
  }
  if (value.length > MAX_DATA_URL_CHARS) {
    throw new ApiError(413, `${field} is too large. Please upload an image under 5 MB.`)
  }
  return value
}

/**
 * Submit verification documents for the signed-in member. Creates a PENDING
 * VerificationSubmission, moves the member to PENDING_ID_REVIEW, and notifies
 * admins. Fast-track members need only a staff ID; manual review also needs
 * proof of employment.
 */
export async function submitVerification(input: {
  userId: string
  idCardUrl?: string
  proofUrl?: string
}) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } })
  if (!user) throw new ApiError(404, "Account not found.")
  if (user.role !== "member") throw new ApiError(403, "Only members can submit verification.")
  if (user.verificationStatus === "FULLY_VERIFIED") {
    throw new ApiError(409, "Your account is already fully verified.")
  }
  if (user.verificationStatus === "PENDING_EMAIL") {
    throw new ApiError(409, "Please confirm your email address before uploading documents.")
  }
  if (user.verificationStatus === "PENDING_ID_REVIEW") {
    throw new ApiError(409, "Your documents are already under review.")
  }

  const type = await reviewTypeForEmail(user.email)

  const idCardUrl = assertImage(input.idCardUrl, "Staff ID")
  if (!idCardUrl) throw new ApiError(400, "A staff ID image is required.")

  const proofUrl = assertImage(input.proofUrl, "Proof of employment")
  if (type === "manual" && !proofUrl) {
    throw new ApiError(400, "Proof of employment is required for manual review.")
  }

  const submission = await prisma.$transaction(async (tx) => {
    const created = await tx.verificationSubmission.create({
      data: {
        memberId: user.id,
        type,
        idCardUrl,
        proofUrl: type === "manual" ? proofUrl : null,
        status: "PENDING",
      },
    })
    await tx.user.update({
      where: { id: user.id },
      data: { verificationStatus: "PENDING_ID_REVIEW" },
    })
    await tx.notification.create({
      data: {
        type: "verification",
        title: "New verification submission",
        body: `${user.fullName} (${user.organisation ?? user.email}) submitted documents for review.`,
        link: "/verification",
      },
    })
    return created
  })

  await logAudit({
    actorId: user.id,
    action: "VERIFICATION_SUBMITTED",
    subject: `Verification documents submitted: ${user.fullName}`,
    metadata: { email: user.email, type },
  })

  return { id: submission.id, type }
}
