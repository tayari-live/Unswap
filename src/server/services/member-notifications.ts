import { prisma } from "@/server/prisma"
import { getUnreadByConversation } from "@/server/services/messaging"
import { pendingReviewsFor } from "@/server/services/reviews"
import { CREDIT_GRANTS, type GrantReason } from "@/server/services/credits"
import { PROFILE_COMPLETE_AT } from "@/server/services/profile"

import type { NotificationKind } from "@/lib/notification-categories"

export type MemberNotification = {
  id: string
  kind: NotificationKind
  title: string
  body: string
  date: Date
  link: string
}

// Only free-credit grants (last 30 days) surface as notifications; hosting-earned
// credits already get context from their swap notification.
const CREDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

// How far ahead a renewal starts being worth mentioning.
const RENEWAL_SOON_MS = 14 * 24 * 60 * 60 * 1000

const fmtDay = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)

/**
 * A derived activity feed for the member: actionable items assembled from swaps,
 * messages, reviews, and account state. (No stored per-user notification table.)
 */
export async function getMemberNotifications(userId: string): Promise<MemberNotification[]> {
  const [user, swaps, unreadRows, pending, submission, grants, subscription] = await Promise.all([
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
    getUnreadByConversation(userId),
    pendingReviewsFor(userId),
    prisma.verificationSubmission.findFirst({
      where: { memberId: userId },
      orderBy: { createdAt: "desc" },
      select: { status: true, reviewNote: true, reviewedAt: true, createdAt: true },
    }),
    prisma.creditTransaction.findMany({
      where: { userId, type: "earned", reason: { not: null }, createdAt: { gte: new Date(Date.now() - CREDIT_WINDOW_MS) } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.subscription.findUnique({ where: { userId } }),
  ])

  const items: MemberNotification[] = []

  // Free-credit grants ("You earned 2 credits — Identity verified").
  for (const c of grants) {
    if (!c.reason || !(c.reason in CREDIT_GRANTS)) continue
    const label = CREDIT_GRANTS[c.reason as GrantReason].title
    items.push({
      id: `credit-${c.id}`,
      kind: "credit",
      title: `You earned ${c.amount} credit${c.amount === 1 ? "" : "s"}`,
      body: label,
      date: c.createdAt,
      link: "/dashboard/credits",
    })
  }

  // Links point at the specific record, not the section: a notification about
  // one request shouldn't leave the member hunting for it in a list. Note the
  // swaps/exchanges split — /dashboard/swaps/:id and /dashboard/exchanges/:id
  // redirect to each other by status, so a CONFIRMED swap belongs on the
  // exchanges route.
  for (const s of swaps) {
    if (s.hostId === userId && s.status === "REQUESTED") {
      items.push({ id: `req-${s.id}`, kind: "swap", title: "New swap request", body: `${s.requester.fullName} requested ${s.listing.title}`, date: s.createdAt, link: `/dashboard/swaps/${s.id}` })
    }
    if (s.requesterId === userId && s.status === "COUNTER_OFFERED") {
      items.push({ id: `cnt-${s.id}`, kind: "counter", title: "Counter-offer received", body: `${s.host.fullName} proposed new dates for ${s.listing.title}`, date: s.createdAt, link: `/dashboard/swaps/${s.id}` })
    }
    if (s.status === "CONFIRMED") {
      const other = s.hostId === userId ? s.requester : s.host
      items.push({ id: `cnf-${s.id}`, kind: "confirmed", title: "Exchange confirmed", body: `Your exchange with ${other.fullName} is confirmed`, date: s.createdAt, link: `/dashboard/exchanges/${s.id}` })
    }
  }

  const unread = unreadRows.reduce((sum, r) => sum + r.unread, 0)
  if (unread > 0) {
    // One unread thread → open it. Several → the inbox is the right landing place.
    items.push({
      id: "msg",
      kind: "message",
      title: "Unread messages",
      body: `You have ${unread} unread message${unread === 1 ? "" : "s"}`,
      date: new Date(),
      link: unreadRows.length === 1 ? `/dashboard/messages/${unreadRows[0].conversationId}` : "/dashboard/messages",
    })
  }

  for (const p of pending) {
    items.push({ id: `rev-${p.swapId}`, kind: "review", title: "Leave a review", body: `Review your exchange with ${p.other.fullName}`, date: new Date(), link: `/dashboard/exchanges/${p.swapId}` })
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
  if (user && user.profileCompletion < PROFILE_COMPLETE_AT) {
    items.push({ id: "prof", kind: "profile", title: "Complete your profile", body: `Your profile is ${user.profileCompletion}% complete`, date: new Date(), link: "/dashboard/profile/edit" })
  }

  // Membership state. These are standing prompts derived from the current
  // subscription row rather than dated events (there's no billing-event log to
  // read), so they carry `date: new Date()` and stay out of ACTIVITY_KINDS —
  // otherwise they'd keep the bell badge lit permanently.
  if (subscription) {
    const renews = subscription.renewsAt
    if (subscription.status === "past_due") {
      items.push({
        id: "sub-pastdue",
        kind: "membership",
        title: "Payment unsuccessful",
        body: "We couldn't process your membership payment. Update your billing to keep your access.",
        date: new Date(),
        link: "/dashboard/subscription",
      })
    } else if (subscription.status === "cancelled") {
      items.push({
        id: "sub-cancelled",
        kind: "membership",
        title: "Membership cancelled",
        body: "Your membership won't renew. You can resubscribe at any time.",
        date: new Date(),
        link: "/dashboard/subscription",
      })
    } else if (subscription.status === "active" && renews && renews.getTime() - Date.now() < RENEWAL_SOON_MS) {
      items.push({
        id: "sub-renewing",
        kind: "membership",
        title: "Membership renews soon",
        body: `Your membership renews on ${fmtDay(renews)}.`,
        date: new Date(),
        link: "/dashboard/subscription",
      })
    }
  }

  items.sort((a, b) => b.date.getTime() - a.date.getTime())
  return items
}

// Kinds that count as "unread" for the bell badge. Standing nags (verification
// prompts, profile, unread messages) are excluded — they carry `date: new Date()`
// and would otherwise keep the badge lit forever. Verification outcomes
// (approved/rejected) are real dated events, so they do count.
export const ACTIVITY_KINDS: MemberNotification["kind"][] = ["swap", "counter", "confirmed", "verified", "rejected", "credit"]

/** Activity items newer than the member's last visit to the notifications page. */
export async function countNewMemberNotifications(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationsSeenAt: true },
  })
  const since = user?.notificationsSeenAt ?? new Date(0)
  const [swaps, reviewed, grants] = await Promise.all([
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
    // Free-credit grants the member hasn't seen yet.
    prisma.creditTransaction.count({
      where: { userId, type: "earned", reason: { not: null }, createdAt: { gt: since } },
    }),
  ])
  return swaps + reviewed + grants
}

/** Clear the bell badge: everything up to now has been seen. */
export function markNotificationsSeen(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { notificationsSeenAt: new Date() },
  })
}
