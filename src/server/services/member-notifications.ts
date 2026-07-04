import { prisma } from "@/server/prisma"
import { getUnreadTotal } from "@/server/services/messaging"
import { pendingReviewsFor } from "@/server/services/reviews"

export type MemberNotification = {
  id: string
  kind: "swap" | "counter" | "confirmed" | "message" | "review" | "verification" | "profile"
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
  const [user, swaps, unread, pending] = await Promise.all([
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

  if (user && user.verificationStatus !== "FULLY_VERIFIED") {
    items.push({ id: "ver", kind: "verification", title: "Verification pending", body: "Complete verification to unlock the full network", date: new Date(), link: "/verify-identity" })
  }
  if (user && user.profileCompletion < 80) {
    items.push({ id: "prof", kind: "profile", title: "Complete your profile", body: `Your profile is ${user.profileCompletion}% complete`, date: new Date(), link: "/dashboard/profile" })
  }

  items.sort((a, b) => b.date.getTime() - a.date.getTime())
  return items
}

// Kinds that count as "unread" for the bell badge. Standing nags (verification,
// profile, unread messages) are excluded — they carry `date: new Date()` and
// would otherwise keep the badge lit forever.
export const ACTIVITY_KINDS: MemberNotification["kind"][] = ["swap", "counter", "confirmed"]

/** Activity items newer than the member's last visit to the notifications page. */
export async function countNewMemberNotifications(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationsSeenAt: true },
  })
  const since = user?.notificationsSeenAt ?? new Date(0)
  return prisma.swapRequest.count({
    where: {
      createdAt: { gt: since },
      OR: [
        { hostId: userId, status: "REQUESTED" },
        { requesterId: userId, status: "COUNTER_OFFERED" },
        { hostId: userId, status: "CONFIRMED" },
        { requesterId: userId, status: "CONFIRMED" },
      ],
    },
  })
}

/** Clear the bell badge: everything up to now has been seen. */
export function markNotificationsSeen(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { notificationsSeenAt: new Date() },
  })
}
