import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { sendEmail } from "@/server/email"
import { logAudit } from "@/server/services/audit"

const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function token() {
  return randomBytes(32).toString("hex")
}

function initialsOf(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()
}

/**
 * Resolve a member email against the admin-editable allowlist.
 * Returns the matched domain row (with fastTrack flag) or null for manual review.
 */
export async function matchAllowedDomain(email: string) {
  const domain = email.slice(email.indexOf("@") + 1).toLowerCase()
  const all = await prisma.allowedDomain.findMany()
  return (
    all.find((d) => domain === d.domain || domain.endsWith(`.${d.domain}`)) ?? null
  )
}

/** Whether an email qualifies for fast-track (ID only) or manual (ID + proof) review. */
export async function reviewTypeForEmail(email: string): Promise<"fast_track" | "manual"> {
  const matched = await matchAllowedDomain(email)
  return matched?.fastTrack ? "fast_track" : "manual"
}

export type RegisterInput = {
  firstName: string
  lastName: string
  email: string
  password: string
}

/** Create a fresh 24h verification token and email the confirm link. */
async function issueVerificationLink(
  user: { id: string; email: string; firstName: string },
  fastTrack: boolean,
) {
  const vToken = token()
  await prisma.emailVerificationToken.create({
    data: {
      token: vToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
  const verifyUrl = `${baseUrl()}/verify?token=${vToken}`
  return sendEmail({
    to: user.email,
    subject: "Confirm your UnSwap email",
    html: `
      <h2>Welcome to UnSwap, ${user.firstName}.</h2>
      <p>Confirm your institutional email to ${
        fastTrack
          ? "fast-track your verification"
          : "continue — your application will then enter manual review"
      }.</p>
      <p><a href="${verifyUrl}">Confirm my email</a></p>
      <p style="color:#6B7689;font-size:12px">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
    `,
    text: `Welcome to UnSwap, ${user.firstName}. Confirm your email: ${verifyUrl}`,
  })
}

/**
 * Register a new member: validate, create the User in PENDING_EMAIL state, and
 * email a verification link. Domain allowlist decides fast-track vs manual.
 */
export async function registerMember(input: RegisterInput) {
  const firstName = input.firstName?.trim()
  const lastName = input.lastName?.trim()
  const email = input.email?.trim().toLowerCase()
  const password = input.password ?? ""

  if (!firstName || !lastName) throw new ApiError(400, "First and last name are required.")
  if (!EMAIL_RE.test(email)) throw new ApiError(400, "Enter a valid email address.")
  if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters.")

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ApiError(409, "An account with this email already exists.")

  const matched = await matchAllowedDomain(email)
  const fastTrack = matched?.fastTrack ?? false

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      role: "member",
      avatarInitials: initialsOf(firstName, lastName),
      verificationStatus: "PENDING_EMAIL",
      profileCompletion: 20,
    },
  })

  const emailSent = await issueVerificationLink({ id: user.id, email, firstName }, fastTrack)

  await logAudit({
    action: "MEMBER_REGISTERED",
    subject: `New member registered: ${user.fullName}`,
    metadata: { email, fastTrack },
  })

  return { fastTrack, emailSent, email }
}

/**
 * Confirm an email-verification token. Moves PENDING_EMAIL members to
 * EMAIL_VERIFIED. Idempotent for already-verified accounts.
 */
export async function verifyEmailToken(rawToken: string) {
  if (!rawToken) throw new ApiError(400, "Missing verification token.")

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token: rawToken },
    include: { user: true },
  })
  if (!record) throw new ApiError(400, "This verification link is invalid.")
  if (record.usedAt) throw new ApiError(410, "This verification link has already been used.")
  if (record.expiresAt < new Date()) throw new ApiError(410, "This verification link has expired.")

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Only advance from the initial state; never downgrade a further-along member.
    ...(record.user.verificationStatus === "PENDING_EMAIL"
      ? [
          prisma.user.update({
            where: { id: record.userId },
            data: { verificationStatus: "EMAIL_VERIFIED" },
          }),
        ]
      : []),
  ])

  return { firstName: record.user.firstName }
}

/**
 * Re-send the email verification link for an account still in PENDING_EMAIL.
 * Silently no-ops for unknown or already-verified emails to avoid revealing
 * whether an account exists.
 */
export async function resendVerificationEmail(rawEmail: string) {
  const email = rawEmail?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) throw new ApiError(400, "Enter a valid email address.")

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.verificationStatus !== "PENDING_EMAIL") return { ok: true }

  // Invalidate any outstanding links, then issue a fresh one.
  await prisma.emailVerificationToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })
  const matched = await matchAllowedDomain(email)
  await issueVerificationLink({ id: user.id, email, firstName: user.firstName }, matched?.fastTrack ?? false)
  return { ok: true }
}
