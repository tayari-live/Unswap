import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { sendEmail, renderEmail } from "@/server/email"
import { notifyAllowed } from "@/server/services/notify"

const APP = () => process.env.AUTH_URL || "http://localhost:3000"
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string))
const fmtD = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)

export function listSwaps() {
  return prisma.swapRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { fullName: true, avatarInitials: true } },
      host: { select: { fullName: true, avatarInitials: true } },
      listing: { select: { title: true, city: true, country: true } },
    },
  })
}

const STATUSES = ["REQUESTED", "COUNTER_OFFERED", "ACCEPTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

// ---- Member-facing swap flow -------------------------------------------------

const SWAP_INCLUDE = {
  requester: { select: { id: true, fullName: true, avatarInitials: true, organisation: true } },
  host: { select: { id: true, fullName: true, avatarInitials: true, organisation: true } },
  listing: { select: { id: true, title: true, city: true, country: true, neighbourhood: true, primaryPhotoUrl: true } },
} as const

const EXCHANGE_STATUSES = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"]

/** Confirmed/ongoing/past exchanges for the member, split upcoming vs past. */
export async function listMemberExchanges(userId: string) {
  const all = await prisma.swapRequest.findMany({
    where: { OR: [{ requesterId: userId }, { hostId: userId }], status: { in: EXCHANGE_STATUSES } },
    orderBy: { startDate: "asc" },
    include: SWAP_INCLUDE,
  })
  const rows = all.map((s) => ({
    ...s,
    role: s.hostId === userId ? ("host" as const) : ("guest" as const),
    other: s.hostId === userId ? s.requester : s.host,
  }))
  return {
    upcoming: rows.filter((r) => r.status !== "COMPLETED"),
    past: rows.filter((r) => r.status === "COMPLETED"),
  }
}

function parseDay(value: unknown, field: string): Date {
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `${field} is not a valid date.`)
  return d
}

/** All swaps involving a member, split into incoming (to host) and outgoing. */
export async function listMemberSwaps(userId: string) {
  const all = await prisma.swapRequest.findMany({
    where: { OR: [{ requesterId: userId }, { hostId: userId }] },
    orderBy: { createdAt: "desc" },
    include: SWAP_INCLUDE,
  })
  const TERMINAL = ["COMPLETED", "CANCELLED"]
  return {
    incoming: all.filter((s) => s.hostId === userId && !TERMINAL.includes(s.status)),
    outgoing: all.filter((s) => s.requesterId === userId && !TERMINAL.includes(s.status)),
    past: all.filter((s) => TERMINAL.includes(s.status)),
  }
}

const DAY = 24 * 60 * 60 * 1000
const nightsBetween = (s: Date, e: Date) => Math.max(1, Math.round((e.getTime() - s.getTime()) / DAY))
// Short-term hosting (7–14 nights) earns credits at an accelerated 1.5× rate.
const earnAmount = (n: number) => (n >= 7 && n <= 14 ? Math.ceil(n * 1.5) : n)

/**
 * Enforce the requester's per-period exchange allowance. A slot is consumed when
 * a request is created and returned when it's declined or cancelled-before-
 * confirmation (tracked via `consumesSlot`). The period is anchored to the
 * subscription renewal date.
 */
async function assertWithinExchangeLimit(requesterId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId: requesterId } })
  if (!sub || sub.status !== "active" || sub.exchangesPerYear === -1) return

  const periodStart = sub.renewsAt ? new Date(sub.renewsAt.getTime() - 365 * DAY) : new Date(Date.now() - 365 * DAY)
  const used = await prisma.swapRequest.count({
    where: { requesterId, consumesSlot: true, createdAt: { gte: periodStart } },
  })
  if (used >= sub.exchangesPerYear) {
    throw new ApiError(
      402,
      `You've used all ${sub.exchangesPerYear} exchange${sub.exchangesPerYear === 1 ? "" : "s"} in your plan this period. Upgrade your membership to request more.`,
    )
  }
}

/**
 * Finalise a completed exchange: set status, post credits (host earns, requester
 * spends), and prompt both parties to review. Shared by manual completion and
 * the auto-complete cron. Idempotent — only acts on confirmed/in-progress swaps.
 */
export async function completeSwap(swapId: string) {
  const swap = await prisma.swapRequest.findUnique({
    where: { id: swapId },
    include: {
      listing: { select: { title: true } },
      host: { select: { id: true, email: true, firstName: true } },
      requester: { select: { id: true, email: true, firstName: true } },
    },
  })
  if (!swap || !["CONFIRMED", "IN_PROGRESS"].includes(swap.status)) return { ok: false }

  await prisma.swapRequest.update({ where: { id: swapId }, data: { status: "COMPLETED", completedAt: new Date() } })

  if (swap.mode === "credits") {
    const nights = nightsBetween(swap.startDate, swap.endDate)
    // Confirm the host's pending earn (or create it), and record the spend.
    const earned = await prisma.creditTransaction.updateMany({
      where: { swapId, type: "earned", status: "pending" },
      data: { status: "confirmed" },
    })
    if (earned.count === 0) {
      await prisma.creditTransaction.create({ data: { userId: swap.hostId, swapId, type: "earned", amount: earnAmount(nights), status: "confirmed" } })
    }
    await prisma.creditTransaction.create({ data: { userId: swap.requesterId, swapId, type: "spent", amount: nights, status: "confirmed" } })
  }

  // Prompt both parties to review.
  for (const p of [swap.host, swap.requester]) {
    if (await notifyAllowed(p.id, "swaps")) {
      await sendEmail({
        to: p.email,
        subject: "How was your exchange?",
        html: renderEmail({
          heading: "Exchange complete",
          body: `<p>Hello ${esc(p.firstName)},</p><p>Your exchange at <strong>${esc(swap.listing.title)}</strong> is complete. Leave a review to support the community and build trust.</p>`,
          ctaLabel: "Leave a review",
          ctaUrl: `${APP()}/dashboard/exchanges`,
        }),
      }).catch((e) => console.error("Completion email failed:", e))
    }
  }

  await logAudit({ action: "SWAP_COMPLETED", subject: `Swap for ${swap.listing.title}` })
  return { ok: true }
}

export async function createSwapRequest(input: {
  requesterId: string
  listingId: string
  mode: string
  startDate: string
  endDate: string
  guests: number
  message?: string
}) {
  const requester = await prisma.user.findUnique({ where: { id: input.requesterId } })
  if (requester?.verificationStatus !== "FULLY_VERIFIED") {
    throw new ApiError(403, "You must be fully verified to request a swap.")
  }

  await assertWithinExchangeLimit(input.requesterId)

  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    include: { blackouts: true },
  })
  if (!listing || listing.status !== "ACTIVE") throw new ApiError(404, "Listing not available.")
  if (listing.ownerId === input.requesterId) throw new ApiError(400, "You cannot request your own listing.")

  // Mode must be compatible with the listing's exchange preference.
  if (!["simultaneous", "credits"].includes(input.mode)) throw new ApiError(400, "Choose a valid swap mode.")
  if (listing.exchangeType !== "either" && listing.exchangeType !== input.mode) {
    throw new ApiError(400, `This home only accepts ${listing.exchangeType} exchanges.`)
  }

  const start = parseDay(input.startDate, "Start date")
  const end = parseDay(input.endDate, "End date")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (start < today) throw new ApiError(400, "Start date cannot be in the past.")
  if (end <= start) throw new ApiError(400, "End date must be after the start date.")

  const guests = Math.max(1, Math.round(Number(input.guests) || 1))
  if (guests > listing.maxGuests) throw new ApiError(400, `This home hosts up to ${listing.maxGuests} guests.`)

  // Reject dates overlapping any blackout range.
  const clash = listing.blackouts.some((b) => start <= b.endDate && end >= b.startDate)
  if (clash) throw new ApiError(409, "Those dates fall within the host's blackout period.")

  // Requested length must match one of the listing's offered duration types.
  const offered = listing.swapDurations ? listing.swapDurations.split(",").filter(Boolean) : []
  if (offered.length) {
    const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000)
    const ranges: Record<string, [number, number]> = {
      short_term: [7, 14], medium_term: [15, 90], long_term: [91, 180], extended: [181, 548],
    }
    const fits = offered.some((d) => ranges[d] && nights >= ranges[d][0] && nights <= ranges[d][1])
    if (!fits) throw new ApiError(400, "Your stay length doesn't match this home's offered swap durations.")
  }

  const swap = await prisma.swapRequest.create({
    data: {
      requesterId: input.requesterId,
      hostId: listing.ownerId,
      listingId: listing.id,
      mode: input.mode,
      startDate: start,
      endDate: end,
      guests,
      message: input.message?.trim() || null,
      status: "REQUESTED",
    },
  })

  await logAudit({
    actorId: input.requesterId,
    action: "SWAP_REQUESTED",
    subject: `Swap requested for ${listing.title}`,
  })

  // Notify the host of the incoming request.
  const host = await prisma.user.findUnique({
    where: { id: listing.ownerId },
    select: { email: true, firstName: true },
  })
  if (host && (await notifyAllowed(listing.ownerId, "swaps"))) {
    await sendEmail({
      to: host.email,
      subject: `New swap request for ${listing.title}`,
      html: renderEmail({
        heading: `${esc(requester.fullName)} requested a swap`,
        body: `<p>Hello ${esc(host.firstName)},</p><p><strong>${esc(requester.fullName)}</strong> would like to stay at <strong>${esc(listing.title)}</strong> from ${fmtD(start)} to ${fmtD(end)} (${guests} guest${guests === 1 ? "" : "s"}).</p>${input.message?.trim() ? `<p style="background:#F7F3E8;border-radius:8px;padding:10px 14px">“${esc(input.message.trim())}”</p>` : ""}`,
        ctaLabel: "View request",
        ctaUrl: `${APP()}/dashboard/swaps`,
      }),
      text: `${requester.fullName} requested a swap at ${listing.title}. View: ${APP()}/dashboard/swaps`,
    })
  }
  return swap
}

/** Host/requester respond to a swap. Each action enforces who may perform it. */
export async function respondToSwap(input: {
  userId: string
  id: string
  action: string
  startDate?: string
  endDate?: string
}) {
  const swap = await prisma.swapRequest.findUnique({
    where: { id: input.id },
    include: {
      listing: { select: { title: true } },
      host: { select: { email: true, firstName: true, fullName: true } },
      requester: { select: { email: true, firstName: true, fullName: true } },
    },
  })
  if (!swap) throw new ApiError(404, "Swap not found.")

  const isHost = swap.hostId === input.userId
  const isRequester = swap.requesterId === input.userId
  if (!isHost && !isRequester) throw new ApiError(403, "You are not part of this swap.")

  // Completion runs through the shared helper (posts credits, prompts reviews).
  if (input.action === "complete") {
    if (!["CONFIRMED", "IN_PROGRESS"].includes(swap.status)) throw new ApiError(409, "Only a confirmed exchange can be completed.")
    await completeSwap(swap.id)
    return { ok: true, status: "COMPLETED" }
  }

  const data: Record<string, unknown> = {}

  switch (input.action) {
    case "accept": // host accepts the original request
      if (!isHost) throw new ApiError(403, "Only the host can accept.")
      if (swap.status !== "REQUESTED") throw new ApiError(409, "This request can no longer be accepted.")
      data.status = "CONFIRMED"
      break
    case "decline":
      if (!isHost) throw new ApiError(403, "Only the host can decline.")
      if (!["REQUESTED", "COUNTER_OFFERED"].includes(swap.status)) throw new ApiError(409, "This request can no longer be declined.")
      data.status = "CANCELLED"
      data.consumesSlot = false // a declined request returns the requester's slot
      break
    case "counter": {
      if (!isHost) throw new ApiError(403, "Only the host can counter-offer.")
      if (swap.status !== "REQUESTED") throw new ApiError(409, "This request can no longer be countered.")
      const start = parseDay(input.startDate, "Start date")
      const end = parseDay(input.endDate, "End date")
      if (end <= start) throw new ApiError(400, "End date must be after the start date.")
      data.status = "COUNTER_OFFERED"
      data.startDate = start
      data.endDate = end
      data.counteredAt = new Date()
      break
    }
    case "accept_counter": // requester accepts the host's counter
      if (!isRequester) throw new ApiError(403, "Only the requester can accept the counter-offer.")
      if (swap.status !== "COUNTER_OFFERED") throw new ApiError(409, "There is no counter-offer to accept.")
      data.status = "CONFIRMED"
      break
    case "cancel": // either party may cancel
      if (["REQUESTED", "COUNTER_OFFERED"].includes(swap.status)) {
        data.status = "CANCELLED"
        data.consumesSlot = false // cancelling before confirmation returns the slot
      } else if (swap.status === "CONFIRMED") {
        data.status = "CANCELLED"
        // Cancelling within 48h of the start date forfeits the exchange slot.
        data.consumesSlot = swap.startDate.getTime() - Date.now() <= 48 * 60 * 60 * 1000
      } else {
        throw new ApiError(409, "This exchange can no longer be cancelled.")
      }
      break
    default:
      throw new ApiError(400, "Unknown action.")
  }

  await prisma.swapRequest.update({ where: { id: swap.id }, data })

  // Credits mode: confirming creates the host's pending earn (posted on completion).
  if ((input.action === "accept" || input.action === "accept_counter") && swap.mode === "credits") {
    await prisma.creditTransaction.create({
      data: { userId: swap.hostId, swapId: swap.id, type: "earned", amount: earnAmount(nightsBetween(swap.startDate, swap.endDate)), status: "pending" },
    })
  }

  await logAudit({
    actorId: input.userId,
    action: `SWAP_${input.action.toUpperCase()}`,
    subject: `Swap for ${swap.listing.title}`,
    metadata: { status: data.status },
  })

  // Notify the relevant counterparty of the outcome.
  const L = esc(swap.listing.title)
  const start = (data.startDate as Date) ?? swap.startDate
  const end = (data.endDate as Date) ?? swap.endDate
  const range = `${fmtD(start)} – ${fmtD(end)}`
  const exchangesUrl = `${APP()}/dashboard/exchanges`
  const swapsUrl = `${APP()}/dashboard/swaps`

  // The email recipient depends on the action; gate on their swap-email pref.
  const recipientId =
    input.action === "accept" || input.action === "decline" || input.action === "counter"
      ? swap.requesterId
      : input.action === "accept_counter"
        ? swap.hostId
        : input.action === "cancel"
          ? (isHost ? swap.requesterId : swap.hostId) // notify the other party
          : isHost
            ? swap.requesterId
            : swap.hostId

  if (await notifyAllowed(recipientId, "swaps")) {
   try {
    if (input.action === "accept" || input.action === "accept_counter") {
      const recip = input.action === "accept" ? swap.requester : swap.host
      await sendEmail({
        to: recip.email,
        subject: "Your UnSwap exchange is confirmed",
        html: renderEmail({
          heading: "Exchange confirmed",
          body: `<p>Hello ${esc(recip.firstName)},</p><p>Your exchange at <strong>${L}</strong> for <strong>${range}</strong> is confirmed. You can download the Swap Agreement from My Exchanges.</p>`,
          ctaLabel: "View exchange",
          ctaUrl: exchangesUrl,
        }),
      })
    } else if (input.action === "decline") {
      await sendEmail({
        to: swap.requester.email,
        subject: "Update on your swap request",
        html: renderEmail({
          heading: "Request not accepted",
          body: `<p>Hello ${esc(swap.requester.firstName)},</p><p>Your request for <strong>${L}</strong> wasn't accepted this time. Plenty of other verified homes await.</p>`,
          ctaLabel: "Discover homes",
          ctaUrl: `${APP()}/dashboard/browse`,
        }),
      })
    } else if (input.action === "counter") {
      await sendEmail({
        to: swap.requester.email,
        subject: `Counter-offer for ${swap.listing.title}`,
        html: renderEmail({
          heading: "Counter-offer received",
          body: `<p>Hello ${esc(swap.requester.firstName)},</p><p><strong>${esc(swap.host.fullName)}</strong> proposed new dates for <strong>${L}</strong>: <strong>${range}</strong>. Review and accept in your swap requests.</p>`,
          ctaLabel: "Review counter-offer",
          ctaUrl: swapsUrl,
        }),
      })
    } else if (input.action === "cancel") {
      const other = isHost ? swap.requester : swap.host
      const canceller = isHost ? swap.host : swap.requester
      await sendEmail({
        to: other.email,
        subject: "A swap was cancelled",
        html: renderEmail({
          heading: "Swap cancelled",
          body: `<p>Hello ${esc(other.firstName)},</p><p>${esc(canceller.fullName)} cancelled the exchange for <strong>${L}</strong>.</p>`,
          ctaLabel: "Discover homes",
          ctaUrl: `${APP()}/dashboard/browse`,
        }),
      })
    }
   } catch (err) {
    console.error("Swap notification email failed:", err)
   }
  }

  return { ok: true, status: data.status }
}

export async function updateSwap(input: { actorId: string; id: string; status?: string; disputed?: boolean }) {
  const swap = await prisma.swapRequest.findUnique({ where: { id: input.id }, include: { listing: true } })
  if (!swap) throw new ApiError(404, "Swap not found.")
  if (input.status && !STATUSES.includes(input.status)) throw new ApiError(400, "Invalid status.")

  await prisma.swapRequest.update({
    where: { id: input.id },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.disputed !== undefined ? { disputed: input.disputed } : {}),
    },
  })

  await logAudit({
    actorId: input.actorId,
    action: input.disputed === false ? "DISPUTE_RESOLVED" : "SWAP_UPDATED",
    subject: `Swap for ${swap.listing.title}`,
    metadata: { status: input.status, disputed: input.disputed },
  })
  return { ok: true }
}

// ---- Scheduled lifecycle (run by the cron) -----------------------------------

/** Auto-cancel counter-offers left unanswered for 7+ days; returns the slot. */
async function expireCounterOffers(): Promise<number> {
  const cutoff = new Date(Date.now() - 7 * DAY)
  const stale = await prisma.swapRequest.findMany({
    where: { status: "COUNTER_OFFERED", counteredAt: { lt: cutoff } },
    select: { id: true },
  })
  for (const s of stale) {
    await prisma.swapRequest.update({ where: { id: s.id }, data: { status: "CANCELLED", consumesSlot: false } })
  }
  return stale.length
}

/** Advance confirmed swaps to IN_PROGRESS once their start date arrives. */
async function progressConfirmed(): Promise<number> {
  const r = await prisma.swapRequest.updateMany({
    where: { status: "CONFIRMED", startDate: { lte: new Date() } },
    data: { status: "IN_PROGRESS" },
  })
  return r.count
}

/** Auto-complete swaps whose end date has passed (posts credits, prompts reviews). */
async function autoCompleteDue(): Promise<number> {
  const due = await prisma.swapRequest.findMany({
    where: { status: { in: ["CONFIRMED", "IN_PROGRESS"] }, endDate: { lte: new Date() } },
    select: { id: true },
  })
  for (const s of due) await completeSwap(s.id)
  return due.length
}

/** Run all swap lifecycle transitions. Called by the cron endpoint. */
export async function runSwapLifecycle() {
  const expiredCounters = await expireCounterOffers()
  const completed = await autoCompleteDue() // complete first (handles end-dated swaps)
  const inProgress = await progressConfirmed()
  return { expiredCounters, inProgress, completed }
}
