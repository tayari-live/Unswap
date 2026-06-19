import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"

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

/** A verified member requests a swap on another member's active listing. */
const ACTIVE_EXCHANGE = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"]

/** Enforce the requester's annual exchange allowance from their subscription tier. */
async function assertWithinExchangeLimit(requesterId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId: requesterId } })
  // Nothing to enforce without an active, finite-allowance plan.
  if (!sub || sub.status !== "active" || sub.exchangesPerYear === -1) return

  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  const used = await prisma.swapRequest.count({
    where: { requesterId, status: { in: ACTIVE_EXCHANGE }, createdAt: { gte: since } },
  })
  if (used >= sub.exchangesPerYear) {
    throw new ApiError(
      402,
      `You've used all ${sub.exchangesPerYear} exchange${sub.exchangesPerYear === 1 ? "" : "s"} in your plan this year. Upgrade your membership to request more.`,
    )
  }
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

  const listing = await prisma.listing.findUnique({ where: { id: input.listingId } })
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
    include: { listing: { select: { title: true } } },
  })
  if (!swap) throw new ApiError(404, "Swap not found.")

  const isHost = swap.hostId === input.userId
  const isRequester = swap.requesterId === input.userId
  if (!isHost && !isRequester) throw new ApiError(403, "You are not part of this swap.")

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
      break
    }
    case "accept_counter": // requester accepts the host's counter
      if (!isRequester) throw new ApiError(403, "Only the requester can accept the counter-offer.")
      if (swap.status !== "COUNTER_OFFERED") throw new ApiError(409, "There is no counter-offer to accept.")
      data.status = "CONFIRMED"
      break
    case "cancel": // requester withdraws
      if (!isRequester) throw new ApiError(403, "Only the requester can cancel.")
      if (!["REQUESTED", "COUNTER_OFFERED"].includes(swap.status)) throw new ApiError(409, "This request can no longer be cancelled.")
      data.status = "CANCELLED"
      break
    case "complete": // either party marks a confirmed exchange complete
      if (!["CONFIRMED", "IN_PROGRESS"].includes(swap.status)) throw new ApiError(409, "Only a confirmed exchange can be completed.")
      data.status = "COMPLETED"
      data.completedAt = new Date()
      break
    default:
      throw new ApiError(400, "Unknown action.")
  }

  await prisma.swapRequest.update({ where: { id: swap.id }, data })
  await logAudit({
    actorId: input.userId,
    action: `SWAP_${input.action.toUpperCase()}`,
    subject: `Swap for ${swap.listing.title}`,
    metadata: { status: data.status },
  })
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
