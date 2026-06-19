import { randomBytes } from "crypto"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { sendEmail } from "@/server/email"
import { matchAllowedDomain } from "@/server/services/registration"

const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EARLY_BIRD_CAP = 500

export function listWaitlist() {
  return prisma.waitlistEntry.findMany({ orderBy: [{ referrals: "desc" }, { createdAt: "asc" }] })
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

/** Public: join the pre-launch waitlist (institutional email required). */
export async function joinWaitlist(input: {
  firstName: string
  lastName: string
  email: string
  ref?: string
}) {
  const firstName = input.firstName?.trim()
  const lastName = input.lastName?.trim()
  const email = input.email?.trim().toLowerCase()

  if (!firstName || !lastName) throw new ApiError(400, "First and last name are required.")
  if (!EMAIL_RE.test(email)) throw new ApiError(400, "Enter a valid email address.")

  const matched = await matchAllowedDomain(email)
  if (!matched) {
    throw new ApiError(400, "Please use your institutional email (e.g. @un.org, @undp.org).")
  }

  // Already on the list → return their existing referral details (idempotent).
  const existing = await prisma.waitlistEntry.findUnique({ where: { email } })
  if (existing) {
    const position = await prisma.waitlistEntry.count({ where: { createdAt: { lte: existing.createdAt } } })
    return {
      alreadyJoined: true,
      referralCode: existing.referralCode,
      referralUrl: referralUrl(existing.referralCode),
      position,
      earlyBird: position <= EARLY_BIRD_CAP,
    }
  }

  const referralCode = await uniqueReferralCode()
  // Resolve and credit the referrer, if any.
  let referredBy: string | null = null
  if (input.ref) {
    const referrer = await prisma.waitlistEntry.findUnique({ where: { referralCode: input.ref } })
    if (referrer && referrer.email !== email) {
      referredBy = referrer.referralCode
      await prisma.waitlistEntry.update({ where: { id: referrer.id }, data: { referrals: { increment: 1 } } })
    }
  }

  const entry = await prisma.waitlistEntry.create({
    data: { firstName, lastName, email, organisation: matched.label, referralCode, referredBy },
  })
  const position = await prisma.waitlistEntry.count()
  const earlyBird = position <= EARLY_BIRD_CAP

  await sendEmail({
    to: email,
    subject: "You're on the UnSwap waitlist",
    html: `
      <h2>Welcome to the waitlist, ${firstName}.</h2>
      <p>You're <strong>#${position}</strong> in line for UnSwap — the verified home exchange network for UN and international organisation professionals.</p>
      ${earlyBird ? `<p>As one of our first ${EARLY_BIRD_CAP} members you qualify for <strong>50% off the Limited 1X plan</strong> at launch.</p>` : ""}
      <p>Move up the list by inviting peers. Refer 5 or more and earn <strong>6 months of Unlimited Pro, free</strong>.</p>
      <p>Your referral link: <a href="${referralUrl(referralCode)}">${referralUrl(referralCode)}</a></p>
    `,
    text: `You're #${position} on the UnSwap waitlist. Your referral link: ${referralUrl(referralCode)}`,
  })

  await logAudit({ action: "WAITLIST_JOINED", subject: `${firstName} ${lastName}`, metadata: { email, referredBy } })
  return { alreadyJoined: false, referralCode, referralUrl: referralUrl(referralCode), position, earlyBird, entryId: entry.id }
}

/** Public leaderboard of top referrers (last name masked for privacy). */
export async function getLeaderboard(limit = 10) {
  const rows = await prisma.waitlistEntry.findMany({
    where: { referrals: { gt: 0 } },
    orderBy: [{ referrals: "desc" }, { createdAt: "asc" }],
    take: limit,
    select: { firstName: true, lastName: true, organisation: true, referrals: true },
  })
  return rows.map((r) => ({
    name: `${r.firstName} ${r.lastName.charAt(0)}.`,
    organisation: r.organisation,
    referrals: r.referrals,
  }))
}

export async function getWaitlistCount() {
  return prisma.waitlistEntry.count()
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
