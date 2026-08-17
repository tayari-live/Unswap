import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { sendEmail, renderEmail, esc } from "@/server/email"
import { logAudit } from "@/server/services/audit"
import { grantCreditsOnce } from "@/server/services/credits"
import { consumeRegisterGrant } from "@/server/services/waitlist"
import { registerSchema, passwordSchema, firstError } from "@/lib/validation/auth"

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
  // Optional signed proof that this email was already verified (e.g. by clicking
  // the waitlist "add your property" link). When valid, the account is created
  // already-verified and no verification email is sent.
  grant?: string
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
    html: renderEmail({
      heading: `Welcome to UnSwap, ${esc(user.firstName)}.`,
      preheader: "Confirm your email to continue your verification.",
      body: `<p style="margin:0 0 14px">You have joined a closed network built exclusively for UN, World Bank, IMF and international organisation professionals.</p>
             <p style="margin:0">Confirm your institutional email to ${
               fastTrack
                 ? "fast-track your verification."
                 : "continue. Your application will then enter manual review."
             }</p>`,
      ctaLabel: "Confirm my email",
      ctaUrl: verifyUrl,
      footnote: "This link expires in 24 hours. If you did not request this, you can safely ignore this email.",
    }),
    text: `Welcome to UnSwap, ${user.firstName}. Confirm your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  })
}

/**
 * Register a new member: validate, create the User in PENDING_EMAIL state, and
 * email a verification link. Domain allowlist decides fast-track vs manual.
 */
export async function registerMember(input: RegisterInput) {
  // The same schema the sign-up form uses. Validating here as well is what
  // makes the client-side check a convenience rather than the only guard —
  // the endpoint is public and can be called directly.
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) throw new ApiError(400, firstError(parsed.error))
  const { firstName, lastName, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ApiError(409, "An account with this email already exists.")

  const matched = await matchAllowedDomain(email)
  const fastTrack = matched?.fastTrack ?? false

  // A valid grant means this exact address was already verified (the waitlist
  // link was clicked from its inbox), so skip the account's own email step. This
  // consumes the grant (single use); we've already passed validation and the
  // existing-account check above, so we're committed to creating the account.
  const preVerified = await consumeRegisterGrant(email, input.grant)

  // Carry over anything they already gave us on the waitlist so they don't set
  // up twice — pull their organisation onto the new account and mark the entry
  // converted. Linked purely by email, so it works however they arrive.
  const waitlisted = await prisma.waitlistEntry.findUnique({ where: { email } })

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
      verificationStatus: preVerified ? "EMAIL_VERIFIED" : "PENDING_EMAIL",
      organisation: waitlisted?.organisation ?? null,
      profileCompletion: waitlisted?.organisation ? 30 : 20,
    },
  })

  if (waitlisted && waitlisted.status !== "converted") {
    await prisma.waitlistEntry.update({ where: { email }, data: { status: "converted" } })
  }

  // Pre-verified accounts (arriving from the waitlist link) skip the email step;
  // everyone else gets the usual verification link.
  const emailSent = preVerified ? false : await issueVerificationLink({ id: user.id, email, firstName }, fastTrack)

  // Free sign-up credit (once per account).
  await grantCreditsOnce(user.id, "welcome")

  await logAudit({
    action: "MEMBER_REGISTERED",
    subject: `New member registered: ${user.fullName}`,
    metadata: { email, fastTrack, preVerified },
  })

  return { fastTrack, emailSent, email, emailVerified: preVerified }
}

const LOGIN_TTL_MS = 60 * 60 * 1000 // one-time sign-in token validity: 1 hour

/** Mint a single-use, 1-hour sign-in token for a user (passwordless login). */
export async function issueLoginToken(userId: string): Promise<string> {
  const t = token()
  await prisma.loginToken.create({
    data: { token: t, userId, expiresAt: new Date(Date.now() + LOGIN_TTL_MS) },
  })
  return t
}

/**
 * Create (or find) the member behind a confirmed waitlist invite and return a
 * one-time login token. The invite click already proved inbox ownership, so a
 * new account is created already EMAIL_VERIFIED and WITHOUT a password — they
 * set one only after onboarding and adding a property. If the account already
 * exists, this just issues a fresh sign-in token (magic-link style).
 */
export async function beginPasswordlessMember(input: {
  email: string
  firstName: string
  lastName: string
}): Promise<string> {
  const email = input.email.trim().toLowerCase()
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()

  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    const waitlisted = await prisma.waitlistEntry.findUnique({ where: { email } })
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: null,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        role: "member",
        avatarInitials: initialsOf(firstName, lastName),
        verificationStatus: "EMAIL_VERIFIED",
        organisation: waitlisted?.organisation ?? null,
        profileCompletion: waitlisted?.organisation ? 30 : 20,
      },
    })
    if (waitlisted && waitlisted.status !== "converted") {
      await prisma.waitlistEntry.update({ where: { email }, data: { status: "converted" } })
    }
    await grantCreditsOnce(user.id, "welcome")
    await logAudit({
      action: "MEMBER_REGISTERED",
      subject: `New member (passwordless): ${user.fullName}`,
      metadata: { email, passwordless: true },
    })
  }

  return issueLoginToken(user.id)
}

/**
 * Email a fresh one-time sign-in link to a passwordless member who left before
 * setting a password (they otherwise have no way back in — the invite link is
 * single-use). Silent no-op for unknown addresses and for accounts that already
 * have a password (those use normal login / forgot-password), so it never
 * reveals whether an address has an account.
 */
export async function sendResumeLink(rawEmail: string) {
  const email = rawEmail?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) return { ok: true as const }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.passwordHash) return { ok: true as const }

  const t = await issueLoginToken(user.id)
  await sendEmail({
    to: email,
    subject: "Your UnSwap sign-in link",
    html: renderEmail({
      heading: `Pick up where you left off, ${esc(user.firstName)}.`,
      preheader: "A one-time link to finish setting up your UnSwap account.",
      body: `<p style="margin:0 0 14px">Use the button below to sign back in and finish setting up your account.</p>
             <p style="margin:0">For your security this link can be used once and expires in an hour.</p>`,
      ctaLabel: "Sign in to UnSwap",
      ctaUrl: `${baseUrl()}/continue?token=${t}`,
      footnote: "If you did not request this, you can ignore this email.",
    }),
    text: `Sign back in to UnSwap: ${baseUrl()}/continue?token=${t}\n\nThis link can be used once and expires in an hour.`,
  })
  return { ok: true as const }
}

/** Welcome / account-ready email, sent once the member sets their password. */
function sendWelcomeEmail(user: { email: string; firstName: string }) {
  return sendEmail({
    to: user.email,
    subject: "Your UnSwap account is ready",
    html: renderEmail({
      heading: `Welcome aboard, ${esc(user.firstName)}.`,
      preheader: "Your account is set up — your home is listed and you're ready to exchange.",
      body: `<p style="margin:0 0 14px">Your account is complete: your email is verified, your property is listed, and your password is set.</p>
             <p style="margin:0">You can now explore homes across the network and arrange exchanges with verified peers.</p>`,
      ctaLabel: "Go to your dashboard",
      ctaUrl: `${baseUrl()}/dashboard`,
      footnote: "If you did not create this account, please contact support.",
    }),
    text: `Welcome aboard, ${user.firstName}. Your UnSwap account is ready: ${baseUrl()}/dashboard`,
  })
}

/**
 * Set the first password for a passwordless member (final step of the waitlist
 * setup flow). Only valid while the account has no password; sends the welcome
 * email once done. The member is already signed in, so no re-login is needed.
 */
export async function setInitialPassword(userId: string, password: string) {
  const parsed = passwordSchema.safeParse(password)
  if (!parsed.success) throw new ApiError(400, firstError(parsed.error))

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError(404, "Account not found.")
  if (user.passwordHash) throw new ApiError(409, "A password is already set for this account.")

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

  await sendWelcomeEmail({ email: user.email, firstName: user.firstName })
  await logAudit({
    action: "MEMBER_PASSWORD_SET",
    subject: `Password set: ${user.fullName}`,
    metadata: { email: user.email },
  })
  return { ok: true }
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
