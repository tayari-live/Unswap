import { randomBytes } from "crypto"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { sendEmail } from "@/server/email"
import { kitSendWaitlistConfirmation, kitAddToForm, kitUpdateReferralCount, kitConfigured } from "@/server/kit"

const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EARLY_BIRD_CAP = 500

/** Admin: the real waitlist (confirmed entries only), best-referrers first. */
export function listWaitlist() {
  return prisma.waitlistEntry.findMany({
    where: { confirmedAt: { not: null } },
    orderBy: [{ referrals: "desc" }, { confirmedAt: "asc" }],
  })
}

async function uniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const code = randomBytes(4).toString("hex") // 8 chars
    const clash = await prisma.waitlistEntry.findUnique({ where: { referralCode: code } })
    if (!clash) return code
  }
  return randomBytes(6).toString("hex")
}

const referralUrl = (code: string) => `${baseUrl()}/join?ref=${code}`
const confirmUrl = (token: string) => `${baseUrl()}/api/waitlist/confirm?token=${token}`

/**
 * Referral-boosted queue position (confirmed entries only): more referrals =
 * higher; ties broken by who confirmed first. Inviting friends moves you up.
 */
async function positionOf(entry: { referrals: number; confirmedAt: Date }) {
  const ahead = await prisma.waitlistEntry.count({
    where: {
      confirmedAt: { not: null },
      OR: [
        { referrals: { gt: entry.referrals } },
        { AND: [{ referrals: entry.referrals }, { confirmedAt: { lt: entry.confirmedAt } }] },
      ],
    },
  })
  return ahead + 1
}

/** Validate a referral code → the referrer's code (never self, never blank). */
async function resolveRef(ref: string | undefined, selfEmail: string) {
  if (!ref) return null
  const referrer = await prisma.waitlistEntry.findUnique({ where: { referralCode: ref } })
  return referrer && referrer.email !== selfEmail ? referrer.referralCode : null
}

/**
 * Step 1 of double opt-in: register intent and email a confirmation link (via
 * Kit). Nothing counts toward the waitlist until the link is clicked, so the
 * referrer is NOT credited here. Open signup — a single name + free-text
 * organisation, no institutional-domain gate (that's enforced later, at
 * identity verification, not at the waitlist).
 */
export async function initiateWaitlist(input: { name: string; email: string; organization?: string; ref?: string }) {
  const name = input.name?.trim()
  const email = input.email?.trim().toLowerCase()

  if (!name) throw new ApiError(400, "Your full name is required.")
  if (!EMAIL_RE.test(email)) throw new ApiError(400, "Enter a valid email address.")

  const [firstName, ...rest] = name.split(/\s+/)
  const lastName = rest.join(" ")
  const organisation = input.organization?.trim() || null

  const existing = await prisma.waitlistEntry.findUnique({ where: { email } })
  if (existing?.confirmedAt) {
    return { status: "already_confirmed" as const, email }
  }

  const token = randomBytes(32).toString("hex")
  const referredBy = await resolveRef(input.ref, email)

  if (existing) {
    // Unconfirmed already — refresh their details + token and re-send the link.
    await prisma.waitlistEntry.update({
      where: { id: existing.id },
      data: { firstName, lastName, organisation, confirmToken: token, referredBy: existing.referredBy ?? referredBy },
    })
  } else {
    await prisma.waitlistEntry.create({
      data: { firstName, lastName, email, organisation, referralCode: await uniqueReferralCode(), referredBy, confirmToken: token },
    })
  }

  const { sent } = await kitSendWaitlistConfirmation({ email, firstName, token })
  await logAudit({ action: "WAITLIST_INITIATED", subject: `${firstName} ${lastName}`, metadata: { email, referredBy } })

  // Without Kit configured (local dev), hand back the link so the flow is testable.
  return { status: "pending" as const, email, emailSent: sent, confirmUrl: kitConfigured() ? undefined : confirmUrl(token) }
}

/**
 * Step 2: the emailed link lands here. Finalize the entry, credit the referrer
 * once, sync Kit, and return their position + referral link for the share page.
 */
export async function confirmWaitlist(token: string) {
  if (!token) throw new ApiError(400, "Missing confirmation token.")
  const entry = await prisma.waitlistEntry.findUnique({ where: { confirmToken: token } })
  if (!entry) throw new ApiError(400, "This confirmation link is invalid or has already been used.")

  const confirmedAt = new Date()
  await prisma.waitlistEntry.update({ where: { id: entry.id }, data: { confirmedAt, confirmToken: null } })

  // Credit the referrer now (only verified sign-ups count).
  if (entry.referredBy) {
    const referrer = await prisma.waitlistEntry.findUnique({ where: { referralCode: entry.referredBy } })
    if (referrer) {
      const updated = await prisma.waitlistEntry.update({ where: { id: referrer.id }, data: { referrals: { increment: 1 } } })
      await kitUpdateReferralCount(referrer.email, updated.referrals)
    }
  }
  await kitAddToForm(entry.email)

  const position = await positionOf({ referrals: entry.referrals, confirmedAt })
  await logAudit({ action: "WAITLIST_CONFIRMED", subject: `${entry.firstName} ${entry.lastName}`, metadata: { email: entry.email } })

  return {
    referralCode: entry.referralCode,
    referralUrl: referralUrl(entry.referralCode),
    position,
    earlyBird: position <= EARLY_BIRD_CAP,
    email: entry.email,
  }
}

/** Public: a confirmed member's live status (position, referral count, link). */
export async function getWaitlistStatus(rawEmail: string) {
  const email = rawEmail?.trim().toLowerCase()
  if (!email) throw new ApiError(400, "Email is required.")
  const e = await prisma.waitlistEntry.findUnique({ where: { email } })
  if (!e || !e.confirmedAt) return { found: false as const }
  const position = await positionOf({ referrals: e.referrals, confirmedAt: e.confirmedAt })
  return {
    found: true as const,
    referralCode: e.referralCode,
    referralUrl: referralUrl(e.referralCode),
    position,
    referrals: e.referrals,
    earlyBird: position <= EARLY_BIRD_CAP,
  }
}

/** Same as above but keyed by referral code — used by the share page. */
export async function getWaitlistStatusByCode(rawCode: string) {
  const code = rawCode?.trim()
  if (!code) throw new ApiError(400, "Referral code is required.")
  const e = await prisma.waitlistEntry.findUnique({ where: { referralCode: code } })
  if (!e || !e.confirmedAt) return { found: false as const }
  const position = await positionOf({ referrals: e.referrals, confirmedAt: e.confirmedAt })
  return {
    found: true as const,
    firstName: e.firstName,
    referralCode: e.referralCode,
    referralUrl: referralUrl(e.referralCode),
    position,
    referrals: e.referrals,
    earlyBird: position <= EARLY_BIRD_CAP,
  }
}

/** Public leaderboard of top referrers (confirmed only; last name masked). */
export async function getLeaderboard(limit = 10) {
  const rows = await prisma.waitlistEntry.findMany({
    where: { confirmedAt: { not: null }, referrals: { gt: 0 } },
    orderBy: [{ referrals: "desc" }, { confirmedAt: "asc" }],
    take: limit,
    select: { firstName: true, lastName: true, organisation: true, referrals: true },
  })
  return rows.map((r) => ({
    name: `${r.firstName} ${r.lastName.charAt(0)}.`,
    organisation: r.organisation,
    referrals: r.referrals,
  }))
}

/** Confirmed-member count (used on the marketing page). */
export async function getWaitlistCount() {
  return prisma.waitlistEntry.count({ where: { confirmedAt: { not: null } } })
}

/** Public social proof: total confirmed + a few recent joiners' initials. */
export async function getWaitlistCountData() {
  const [count, recent] = await Promise.all([
    prisma.waitlistEntry.count({ where: { confirmedAt: { not: null } } }),
    prisma.waitlistEntry.findMany({
      where: { confirmedAt: { not: null } },
      orderBy: { confirmedAt: "desc" },
      take: 4,
      select: { firstName: true, lastName: true },
    }),
  ])
  const recentJoiners = recent.map((r) => ({
    initials: `${r.firstName?.[0] ?? ""}${r.lastName?.[0] ?? ""}`.toUpperCase() || "?",
  }))
  return { count, recentJoiners }
}

/** Admin: CSV of all waitlist entries. */
export async function waitlistCsv(): Promise<string> {
  const rows = await prisma.waitlistEntry.findMany({ orderBy: { createdAt: "asc" } })
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const header = ["First name", "Last name", "Email", "Organisation", "Referral code", "Referred by", "Referrals", "Status", "Joined"]
  const lines = rows.map((r) =>
    [r.firstName, r.lastName, r.email, r.organisation, r.referralCode, r.referredBy, r.referrals, r.status, r.createdAt.toISOString()]
      .map(esc).join(","),
  )
  return [header.map(esc).join(","), ...lines].join("\n")
}

/** Admin: invite every pending entry (sets status invited + emails them). */
export async function inviteAllPending(actorId: string) {
  const pending = await prisma.waitlistEntry.findMany({ where: { status: "pending" } })
  for (const e of pending) {
    await prisma.waitlistEntry.update({ where: { id: e.id }, data: { status: "invited" } })
    await sendEmail({
      to: e.email,
      subject: "Your UnSwap early access invitation",
      html: `<h2>You're invited, ${e.firstName}.</h2><p>Your early access to UnSwap is ready. Sign in to verify your status and claim your founding-member incentives.</p>`,
    })
  }
  await logAudit({ actorId, action: "WAITLIST_BULK_INVITED", subject: `Invited ${pending.length} pending members` })
  return { invited: pending.length }
}

const ALLOWED = ["pending", "invited", "converted"]

export async function setWaitlistStatus(input: { actorId: string; id: string; status: string }) {
  if (!ALLOWED.includes(input.status)) throw new ApiError(400, "Invalid status.")
  const entry = await prisma.waitlistEntry.findUnique({ where: { id: input.id } })
  if (!entry) throw new ApiError(404, "Waitlist entry not found.")

  await prisma.waitlistEntry.update({ where: { id: input.id }, data: { status: input.status } })

  if (input.status === "invited") {
    await sendEmail({
      to: entry.email,
      subject: "Your UnSwap early access invitation",
      html: `
        <h2>You're invited, ${entry.firstName}.</h2>
        <p>Your early access to UnSwap is ready. As a founding waitlist member you qualify
        for launch incentives. Sign in to verify your professional status and claim your spot.</p>
      `,
    })
  }

  await logAudit({
    actorId: input.actorId,
    action: "WAITLIST_STATUS_CHANGED",
    subject: `${entry.firstName} ${entry.lastName} → ${input.status}`,
    metadata: { email: entry.email, status: input.status },
  })
  return { ok: true }
}
