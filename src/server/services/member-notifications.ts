import { prisma } from "@/server/prisma"
import { getUnreadTotal } from "@/server/services/messaging"
import { pendingReviewsFor } from "@/server/services/reviews"

export type MemberNotification = {
  id: string
  kind: "swap" | "counter" | "confirmed" | "message" | "review" | "verification" | "verified" | "rejected" | "profile"
  title: string
  body: string
  date: Date
  link: string
}

/**
 * A derived activity feed for the member: actionable items assembled from swaps,
 * messages, reviews, and account state. (No stored per-user notification table.)
 */
export async function getMemberNotifications(userId: string): Promise<MemberNotification[]> {
  const [user, swaps, unread, pending, submission] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.swapRequest.findMany({
      where: { OR: [{ hostId: userId }, { requesterId: userId }] },
      include: {
        host: { select: { fullName: true } },
        requester: { select: { fullName: true } },
        listing: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    getUnreadTotal(userId),
    pendingReviewsFor(userId),
    prisma.verificationSubmission.findFirst({
      where: { memberId: userId },
      orderBy: { createdAt: "desc" },
      select: { status: true, reviewNote: true, reviewedAt: true, createdAt: true },
    }),
  ])

  const items: MemberNotification[] = []

  for (const s of swaps) {
    if (s.hostId === userId && s.status === "REQUESTED") {
      items.push({ id: `req-${s.id}`, kind: "swap", title: "New swap request", body: `${s.requester.fullName} requested ${s.listing.title}`, date: s.createdAt, link: "/dashboard/swaps" })
    }
    if (s.requesterId === userId && s.status === "COUNTER_OFFERED") {
      items.push({ id: `cnt-${s.id}`, kind: "counter", title: "Counter-offer received", body: `${s.host.fullName} proposed new dates for ${s.listing.title}`, date: s.createdAt, link: "/dashboard/swaps" })
    }
    if (s.status === "CONFIRMED") {
      const other = s.hostId === userId ? s.requester : s.host
      items.push({ id: `cnf-${s.id}`, kind: "confirmed", title: "Exchange confirmed", body: `Your exchange with ${other.fullName} is confirmed`, date: s.createdAt, link: "/dashboard/exchanges" })
    }
  }

  if (unread > 0) {
    items.push({ id: "msg", kind: "message", title: "Unread messages", body: `You have ${unread} unread message${unread === 1 ? "" : "s"}`, date: new Date(), link: "/dashboard/messages" })
  }

  for (const p of pending) {
    items.push({ id: `rev-${p.swapId}`, kind: "review", title: "Leave a review", body: `Review your exchange with ${p.other.fullName}`, date: new Date(), link: "/dashboard/exchanges" })
  }

  // Verification: surface the actual outcome, not a generic nag. Rejection and
  // approval are real, timestamped events (they light the bell until seen);
  // the other states are standing prompts.
  if (user) {
    const status = user.verificationStatus
    const reviewedAt = submission?.reviewedAt ?? undefined
    const RECENT_MS = 30 * 24 * 60 * 60 * 1000
    if (status === "REJECTED") {
      items.push({
        id: "ver-rejected",
        kind: "rejected",
        title: "Verification declined",
        body: submission?.reviewNote?.trim() || "We couldn't verify your submission. You're welcome to resubmit updated documents.",
        date: reviewedAt ?? new Date(),
        link: "/verify-identity",
      })
    } else if (status === "SUSPENDED") {
      items.push({ id: "ver-suspended", kind: "rejected", title: "Account suspended", body: "Your access has been suspended. Contact hello@unswap.net to resolve this.", date: new Date(), link: "/dashboard/notifications" })
    } else if (status === "PENDING_ID_REVIEW") {
      items.push({ id: "ver-review", kind: "verification", title: "Verification under review", body: "We're reviewing your documents — usually within 2 business days.", date: submission?.createdAt ?? new Date(), link: "/verify-identity" })
    } else if (status === "EMAIL_VERIFIED") {
      items.push({ id: "ver-getid", kind: "verification", title: "Get verified", body: "Upload your staff ID to unlock listings, swaps, and messaging.", date: new Date(), link: "/verify-identity" })
    } else if (status === "PENDING_EMAIL") {
      items.push({ id: "ver-email", kind: "verification", title: "Confirm your email", body: "Check your inbox to confirm your institutional email address.", date: new Date(), link: "/verify-identity" })
    } else if (status === "FULLY_VERIFIED" && reviewedAt && Date.now() - reviewedAt.getTime() < RECENT_MS) {
      // Recently approved — a positive, self-expiring confirmation.
      items.push({ id: "ver-approved", kind: "verified", title: "You're verified", body: "Full network access unlocked. You can now list your home and arrange exchanges.", date: reviewedAt, link: "/dashboard/browse" })
    }
  }
  if (user && user.profileCompletion < 80) {
    items.push({ id: "prof", kind: "profile", title: "Complete your profile", body: `Your profile is ${user.profileCompletion}% complete`, date: new Date(), link: "/dashboard/profile" })
  }

  items.sort((a, b) => b.date.getTime() - a.date.getTime())
  return items
}

// Kinds that count as "unread" for the bell badge. Standing nags (verification
// prompts, profile, unread messages) are excluded — they carry `date: new Date()`
// and would otherwise keep the badge lit forever. Verification outcomes
// (approved/rejected) are real dated events, so they do count.
export const ACTIVITY_KINDS: MemberNotification["kind"][] = ["swap", "counter", "confirmed", "verified", "rejected"]

/** Activity items newer than the member's last visit to the notifications page. */
export async function countNewMemberNotifications(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationsSeenAt: true },
  })
  const since = user?.notificationsSeenAt ?? new Date(0)
  const [swaps, reviewed] = await Promise.all([
    prisma.swapRequest.count({
      where: {
        createdAt: { gt: since },
        OR: [
          { hostId: userId, status: "REQUESTED" },
          { requesterId: userId, status: "COUNTER_OFFERED" },
          { hostId: userId, status: "CONFIRMED" },
          { requesterId: userId, status: "CONFIRMED" },
        ],
      },
    }),
    // A verification decision (approve/reject) the member hasn't seen yet.
    prisma.verificationSubmission.count({
      where: { memberId: userId, status: { in: ["APPROVED", "REJECTED"] }, reviewedAt: { gt: since } },
    }),
  ])
  return swaps + reviewed
}

/** Clear the bell badge: everything up to now has been seen. */
export function markNotificationsSeen(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { notificationsSeenAt: new Date() },
  })
}
