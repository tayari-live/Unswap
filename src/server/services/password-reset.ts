import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { sendEmail } from "@/server/email"
import { logAudit } from "@/server/services/audit"

const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"

function token() {
  return randomBytes(32).toString("hex")
}

/**
 * Begin a password reset. Always resolves without revealing whether the email
 * exists (prevents account enumeration). Emails a reset link when it does.
 */
export async function requestPasswordReset(rawEmail: string) {
  const email = rawEmail?.trim().toLowerCase()
  if (!email) throw new ApiError(400, "Enter your email address.")

  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    const resetToken = token()
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })

    const resetUrl = `${baseUrl()}/reset-password?token=${resetToken}`
    await sendEmail({
      to: email,
      subject: "Reset your UnSwap password",
      html: `
        <h2>Hello ${user.firstName},</h2>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Choose a new password</a></p>
        <p style="color:#6B7689;font-size:12px">This link expires in 1 hour. If you didn't request this, you can safely ignore it.</p>
      `,
      text: `Reset your UnSwap password: ${resetUrl}`,
    })

    await logAudit({
      actorId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      subject: `Password reset requested: ${user.fullName}`,
      metadata: { email },
    })
  }

  // Same response either way.
  return { ok: true }
}

/** Complete a password reset using a one-time token. */
export async function resetPassword(rawToken: string, password: string) {
  if (!rawToken) throw new ApiError(400, "Missing reset token.")
  if (!password || password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.")
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: rawToken },
    include: { user: true },
  })
  if (!record) throw new ApiError(400, "This reset link is invalid.")
  if (record.usedAt) throw new ApiError(410, "This reset link has already been used.")
  if (record.expiresAt < new Date()) throw new ApiError(410, "This reset link has expired.")

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other outstanding reset tokens for this user.
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ])

  await logAudit({
    actorId: record.userId,
    action: "PASSWORD_RESET_COMPLETED",
    subject: `Password reset completed: ${record.user.fullName}`,
  })

  return { ok: true }
}
