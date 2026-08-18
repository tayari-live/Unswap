import { randomBytes } from "crypto"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { sendEmail, renderEmail, esc, emailConfigured } from "@/server/email"
import { kitAddToForm, kitUpdateReferralCount } from "@/server/kit"

const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EARLY_BIRD_CAP = 500
const GRANT_TTL_MS = 60 * 60 * 1000 // registration grant validity: 1 hour

/** Admin: all entries — confirmed first (best-referrers), then unconfirmed leads. */
export function listWaitlist() {
  return prisma.waitlistEntry.findMany({
    orderBy: [{ confirmedAt: { sort: "desc", nulls: "last" } }, { referrals: "desc" }, { createdAt: "asc" }],
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

const referralUrl = (code: string) => `${baseUrl()}/waitlist?ref=${code}`
const confirmUrl = (token: string) => `${baseUrl()}/api/waitlist/confirm?token=${token}`

/**
 * The exclusive-invite email, sent from here rather than triggered as a Kit
 * automation, so the wording lives with every other transactional email
 * instead of in a dashboard. Shared by first signup and both admin resends —
 * three copies of the same letter would drift apart.
 *
 * The link doubles as email verification: clicking it proves the person owns
 * the inbox (which is what lets registration skip its own verification step)
 * and drops them straight into adding their property. Kit only receives an
 * address once that link is clicked — an unconfirmed address does not belong on
 * a marketing list.
 */
function sendJoinEmail(email: string, firstName: string, token: string) {
  return sendEmail({
    to: email,
    subject: "You're in — add your property on UnSwap",
    html: renderEmail({
      heading: `You're in, ${esc(firstName)}.`,
      preheader: "Your exclusive invite to add your property is ready.",
      body: `<p style="margin:0 0 14px">Welcome to UnSwap, the closed home exchange network for staff of the UN, World Bank, IMF and other international organisations. Your place is reserved.</p>
             <p style="margin:0">As a founding member you can add your property now. The button below confirms your email and takes you straight there — no separate verification step.</p>`,
      ctaLabel: "Add your property",
      ctaUrl: confirmUrl(token),
      footnote: "If you did not request this, you can ignore this email and nothing further will happen.",
    }),
    text: `You're in, ${firstName}. Add your property on UnSwap — this link also confirms your email: ${confirmUrl(token)}\n\nIf you did not request this, you can ignore this email.`,
  })
}

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
    // Already on the list. Replying "already confirmed" would let anyone test
    // an address from this form, so send their place to the inbox and return
    // exactly what a first-time signup returns.
    await sendWaitlistStatusLink(email)
    // Their own code, so returning it to their own submission just sends them
    // back to their share page — it reveals nothing a stranger could not.
    return { status: "pending" as const, email, referralCode: existing.referralCode, emailSent: true, confirmUrl: undefined }
  }

  const token = randomBytes(32).toString("hex")
  const referredBy = await resolveRef(input.ref, email)

  let created = existing
  if (existing) {
    // Unconfirmed already — refresh their details + token and re-send the link.
    await prisma.waitlistEntry.update({
      where: { id: existing.id },
      data: { firstName, lastName, organisation, confirmToken: token, referredBy: existing.referredBy ?? referredBy },
    })
  } else {
    created = await prisma.waitlistEntry.create({
      data: { firstName, lastName, email, organisation, referralCode: await uniqueReferralCode(), referredBy, confirmToken: token },
    })
  }

  const sent = await sendJoinEmail(email, firstName, token)
  const referralCode = created!.referralCode // set by the update (existing) or create branch above

  await logAudit({ action: "WAITLIST_INITIATED", subject: `${firstName} ${lastName}`, metadata: { email, referredBy } })

  // Without a mail token (local dev), hand back the link so the flow is testable.
  return { status: "pending" as const, email, referralCode, emailSent: sent, confirmUrl: emailConfigured() ? undefined : confirmUrl(token) }
}

/**
 * Step 2: the emailed link lands here. Finalize the entry, credit the referrer
 * once, sync Kit, and return their position + referral link for the share page.
 */
export async function confirmWaitlist(token: string) {
  if (!token) throw new ApiError(400, "Missing confirmation token.")
  const entry = await prisma.waitlistEntry.findUnique({ where: { confirmToken: token } })
  if (!entry) throw new ApiError(400, "This confirmation link is invalid or has already been used.")

  // Idempotent re-click: the link is kept resolvable (confirmToken is not nulled)
  // so a second visit doesn't dead-end on an error. The side effects below run
  // once — on a repeat we report the confirmed state and let the caller route
  // the person to sign in instead of re-crediting or re-minting anything.
  if (entry.confirmedAt) {
    return {
      alreadyConfirmed: true as const,
      email: entry.email,
      firstName: entry.firstName,
      lastName: entry.lastName,
      referralCode: entry.referralCode,
      referralUrl: referralUrl(entry.referralCode),
      position: 0,
      earlyBird: false,
      registerGrant: "",
    }
  }

  const confirmedAt = new Date()
  // Mint a single-use grant: proof this person owns the address, handed to
  // /register so the account is created already email-verified. Stored on the
  // row (not a stateless token) so it is consumed exactly once and expires.
  const registerGrant = randomBytes(32).toString("hex")
  const registerGrantExpires = new Date(Date.now() + GRANT_TTL_MS)
  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    // confirmToken kept (not nulled) so a re-click still resolves to this row.
    data: { confirmedAt, registerGrant, registerGrantExpires },
  })

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

  // No "you're on the waitlist" email here any more: the share page was already
  // shown at signup, and this link now leads straight on to registration rather
  // than back to the share page. A second email would only repeat that step.

  return {
    alreadyConfirmed: false as const,
    referralCode: entry.referralCode,
    referralUrl: referralUrl(entry.referralCode),
    position,
    earlyBird: position <= EARLY_BIRD_CAP,
    email: entry.email,
    firstName: entry.firstName,
    lastName: entry.lastName,
    registerGrant,
  }
}

/**
 * Consume a registration grant (see confirmWaitlist). Valid only if it matches
 * the given email, has not expired, and has not already been used. The update is
 * atomic — the row is nulled in the same statement that matches it — so it is
 * consumed exactly once even under concurrent registrations. Returns whether the
 * email is proven (grant was valid and is now spent).
 */
export async function consumeRegisterGrant(rawEmail: string, token: string | undefined): Promise<boolean> {
  if (!token) return false
  const email = rawEmail?.trim().toLowerCase()
  const res = await prisma.waitlistEntry.updateMany({
    where: { registerGrant: token, email, registerGrantExpires: { gt: new Date() } },
    data: { registerGrant: null, registerGrantExpires: null },
  })
  return res.count === 1
}

/**
 * Email a confirmed member their share link.
 *
 * Replaces answering "is this address on the waitlist?" to whoever asks: the
 * response is identical either way, so the only party who learns anything is
 * whoever controls the inbox. Unknown and unconfirmed addresses are a silent
 * no-op rather than an error, for the same reason.
 */
export async function sendWaitlistStatusLink(rawEmail: string) {
  const email = rawEmail?.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) throw new ApiError(400, "Enter a valid email address.")

  const e = await prisma.waitlistEntry.findUnique({ where: { email } })
  if (!e?.confirmedAt) return { ok: true as const }

  const position = await positionOf({ referrals: e.referrals, confirmedAt: e.confirmedAt })
  await sendEmail({
    to: e.email,
    subject: "Your UnSwap waitlist place",
    html: renderEmail({
      heading: `Here's your link, ${esc(e.firstName)}.`,
      preheader: `You are number ${position} on the waitlist.`,
      body: `<p style="margin:0 0 14px">You are currently <strong>number ${position}</strong> on the waitlist, with <strong>${e.referrals}</strong> confirmed invitation${e.referrals === 1 ? "" : "s"}.</p>
             <p style="margin:0">Use the link below to track your position and invite peers. Each one who joins moves you up the queue.</p>`,
      ctaLabel: "View my place",
      ctaUrl: `${baseUrl()}/waitlist/success?ref=${e.referralCode}`,
      footnote: "If you did not request this, you can ignore this email.",
    }),
    text: `You are number ${position} on the UnSwap waitlist.\n\nTrack your place: ${baseUrl()}/waitlist/success?ref=${e.referralCode}`,
  })

  return { ok: true as const }
}


/** Same as above but keyed by referral code — used by the share page. */
export async function getWaitlistStatusByCode(rawCode: string) {
  const code = rawCode?.trim()
  if (!code) throw new ApiError(400, "Referral code is required.")
  const e = await prisma.waitlistEntry.findUnique({ where: { referralCode: code } })
  if (!e) return { found: false as const }
  // Unconfirmed entries now reach the share page immediately after signup (the
  // confirmation click happens later, from the email). Show a provisional
  // position — computed as if they confirmed now — and flag it as pending so the
  // page can say the email is on its way.
  const pending = !e.confirmedAt
  const position = await positionOf({ referrals: e.referrals, confirmedAt: e.confirmedAt ?? new Date() })
  return {
    found: true as const,
    pending,
    firstName: e.firstName,
    referralCode: e.referralCode,
    referralUrl: referralUrl(e.referralCode),
    position,
    referrals: e.referrals,
    earlyBird: position <= EARLY_BIRD_CAP,
  }
}

/**
 * Public: re-send the "add your property" invite for a still-unconfirmed entry,
 * keyed by the referral code the share page already holds. A fresh confirm token
 * is issued so the previous link stops working. Unknown or already-confirmed
 * codes are a silent no-op (nothing to resend, and it reveals nothing).
 */
export async function resendJoinEmail(rawCode: string) {
  const code = rawCode?.trim()
  if (!code) return { ok: true as const }
  const entry = await prisma.waitlistEntry.findUnique({ where: { referralCode: code } })
  if (!entry || entry.confirmedAt) return { ok: true as const }
  const token = randomBytes(32).toString("hex")
  await prisma.waitlistEntry.update({ where: { id: entry.id }, data: { confirmToken: token } })
  await sendJoinEmail(entry.email, entry.firstName, token)
  return { ok: true as const }
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
  // Named distinctly so it cannot be mistaken for (or shadow) the HTML escaper
  // imported for the email templates above — the two are not interchangeable.
  const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const header = ["First name", "Last name", "Email", "Organisation", "Referral code", "Referred by", "Referrals", "Status", "Joined"]
  const lines = rows.map((r) =>
    [r.firstName, r.lastName, r.email, r.organisation, r.referralCode, r.referredBy, r.referrals, r.status, r.createdAt.toISOString()]
      .map(csvCell).join(","),
  )
  return [header.map(csvCell).join(","), ...lines].join("\n")
}

/** Admin: invite every pending entry (sets status invited + emails them). */
export async function inviteAllPending(actorId: string) {
  const pending = await prisma.waitlistEntry.findMany({ where: { status: "pending" } })
  for (const e of pending) {
    await prisma.waitlistEntry.update({ where: { id: e.id }, data: { status: "invited" } })
    await sendEmail({
      to: e.email,
      subject: "Your UnSwap early access invitation",
      html: renderEmail({
        heading: `You're invited, ${esc(e.firstName)}.`,
        preheader: "Your early access to UnSwap is ready.",
        body: `<p style="margin:0">Your early access to UnSwap is ready. Sign in to verify your professional status and claim your founding-member incentives.</p>`,
        ctaLabel: "Claim your access",
        ctaUrl: `${baseUrl()}/register?email=${encodeURIComponent(e.email)}`,
      }),
    })
  }
  await logAudit({ actorId, action: "WAITLIST_BULK_INVITED", subject: `Invited ${pending.length} pending members` })
  return { invited: pending.length }
}

/**
 * Admin: import warm leads (e.g. a Kit export of people who signed up but never
 * confirmed) as PENDING, UNCONFIRMED entries. Each gets a fresh confirm token so
 * a confirmation email can be (re)sent; deduped by email. `confirmedAt` stays
 * null, so they don't count on the public waitlist until they actually confirm.
 */
export async function importWaitlist(actorId: string, rows: { email?: string; name?: string; organisation?: string }[]) {
  let imported = 0
  let skipped = 0
  let invalid = 0
  for (const row of rows) {
    const email = row.email?.trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email)) { invalid++; continue }
    const existing = await prisma.waitlistEntry.findUnique({ where: { email } })
    if (existing) { skipped++; continue }
    const name = (row.name || "").trim()
    const parts = name ? name.split(/\s+/) : [email.split("@")[0]]
    const firstName = parts[0] || email.split("@")[0]
    const lastName = parts.slice(1).join(" ")
    await prisma.waitlistEntry.create({
      data: {
        firstName,
        lastName,
        email,
        organisation: row.organisation?.trim() || null,
        referralCode: await uniqueReferralCode(),
        confirmToken: randomBytes(32).toString("hex"),
        status: "pending",
      },
    })
    imported++
  }
  await logAudit({ actorId, action: "WAITLIST_IMPORTED", subject: `Imported ${imported} leads`, metadata: { imported, skipped, invalid } })
  return { imported, skipped, invalid }
}

/** Parse a pasted/uploaded CSV into import rows, matching columns by header. */
export function parseWaitlistCsv(text: string): { email?: string; name?: string; organisation?: string }[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length)
  if (lines.length === 0) return []
  const splitRow = (line: string) => {
    const out: string[] = []
    let cur = ""
    let q = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q
      } else if (c === "," && !q) { out.push(cur); cur = "" } else cur += c
    }
    out.push(cur)
    return out.map((s) => s.trim())
  }
  const header = splitRow(lines[0]).map((h) => h.toLowerCase())
  const find = (pred: (h: string) => boolean) => header.findIndex(pred)
  const iEmail = find((h) => h.includes("email"))
  const iFirst = find((h) => h === "first name" || h === "first_name" || h === "firstname")
  const iLast = find((h) => h.includes("last name") || h === "lastname")
  const iName = find((h) => (h === "name" || h.includes("full name")) )
  const iOrg = find((h) => h.includes("organi") || h === "org" || h.includes("affiliation"))
  // No recognisable header → assume the first column is email.
  const emailCol = iEmail >= 0 ? iEmail : 0
  const dataLines = iEmail >= 0 || iFirst >= 0 || iName >= 0 ? lines.slice(1) : lines
  return dataLines.map((line) => {
    const cols = splitRow(line)
    const name = iName >= 0 ? cols[iName] : [iFirst >= 0 ? cols[iFirst] : "", iLast >= 0 ? cols[iLast] : ""].filter(Boolean).join(" ")
    return { email: cols[emailCol], name: name || undefined, organisation: iOrg >= 0 ? cols[iOrg] : undefined }
  })
}

/** Admin: re-send the confirmation email to one unconfirmed entry (fresh token). */
export async function resendConfirmation(actorId: string, id: string) {
  const entry = await prisma.waitlistEntry.findUnique({ where: { id } })
  if (!entry) throw new ApiError(404, "Waitlist entry not found.")
  if (entry.confirmedAt) throw new ApiError(409, "This member has already confirmed their spot.")
  const token = randomBytes(32).toString("hex")
  await prisma.waitlistEntry.update({ where: { id }, data: { confirmToken: token } })
  const sent = await sendJoinEmail(entry.email, entry.firstName, token)
  await logAudit({ actorId, action: "WAITLIST_RESEND", subject: `${entry.firstName} ${entry.lastName}`, metadata: { email: entry.email, sent } })
  return { sent, confirmUrl: emailConfigured() ? undefined : confirmUrl(token) }
}

/** Admin: re-send the confirmation email to every unconfirmed entry. */
export async function resendAllUnconfirmed(actorId: string) {
  const rows = await prisma.waitlistEntry.findMany({ where: { confirmedAt: null } })
  let sent = 0
  for (const e of rows) {
    const token = randomBytes(32).toString("hex")
    await prisma.waitlistEntry.update({ where: { id: e.id }, data: { confirmToken: token } })
    if (await sendJoinEmail(e.email, e.firstName, token)) sent++
  }
  await logAudit({ actorId, action: "WAITLIST_RESEND_ALL", subject: `Resent to ${rows.length} unconfirmed`, metadata: { total: rows.length, sent } })
  return { total: rows.length, sent }
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
      html: renderEmail({
        heading: `You're invited, ${esc(entry.firstName)}.`,
        preheader: "Your early access to UnSwap is ready.",
        body: `<p style="margin:0">Your early access to UnSwap is ready. As a founding waitlist member you qualify for launch incentives. Sign in to verify your professional status and claim your spot.</p>`,
        ctaLabel: "Claim your access",
        ctaUrl: `${baseUrl()}/register?email=${encodeURIComponent(entry.email)}`,
      }),
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
