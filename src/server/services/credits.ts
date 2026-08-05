import { prisma } from "@/server/prisma"

// Free-credit grants (1 credit = 1 night). Amounts are the single source of
// truth — tweak here to change the economy. `reason` is stored on the ledger
// row and drives both idempotency and the human label shown to members.
export const CREDIT_GRANTS = {
  welcome: { amount: 1, title: "Welcome bonus" },
  profile_complete: { amount: 1, title: "Profile completed" },
  first_listing: { amount: 3, title: "First listing published" },
  verified: { amount: 2, title: "Identity verified" },
  first_subscription: { amount: 3, title: "Subscription bonus" },
} as const
export type GrantReason = keyof typeof CREDIT_GRANTS

/**
 * Grant a one-time free-credit bonus. Idempotent per (user, reason): a member
 * can never earn the same bonus twice (re-publishing a listing, re-verifying,
 * renewing, etc. only ever pays once). Safe to call from any lifecycle hook.
 */
export async function grantCreditsOnce(userId: string, reason: GrantReason) {
  const { amount } = CREDIT_GRANTS[reason]
  const existing = await prisma.creditTransaction.findFirst({
    where: { userId, reason, type: "earned" },
    select: { id: true },
  })
  if (existing) return { granted: false as const }
  await prisma.creditTransaction.create({
    data: { userId, type: "earned", amount, status: "confirmed", reason },
  })
  return { granted: true as const, amount }
}

export type PendingGrant = { id: string; amount: number; title: string; reason: GrantReason }

/**
 * Free-credit grants the member has earned but not yet been congratulated for.
 * Drives the one-time celebration; tracked separately from the notifications
 * badge so reading the bell never swallows the moment.
 */
export async function getUncelebratedGrants(userId: string): Promise<PendingGrant[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsCelebratedAt: true },
  })
  const since = user?.creditsCelebratedAt ?? new Date(0)
  const rows = await prisma.creditTransaction.findMany({
    where: { userId, type: "earned", status: "confirmed", reason: { not: null }, createdAt: { gt: since } },
    orderBy: { createdAt: "asc" },
  })
  return rows
    .filter((r) => r.reason && r.reason in CREDIT_GRANTS)
    .map((r) => ({
      id: r.id,
      amount: r.amount,
      reason: r.reason as GrantReason,
      title: CREDIT_GRANTS[r.reason as GrantReason].title,
    }))
}

/** Mark the celebration as shown, so it never repeats for the same grants. */
export function markCreditsCelebrated(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { creditsCelebratedAt: new Date() },
  })
}

export type CreditTxn = {
  id: string
  type: "earned" | "spent"
  amount: number // positive earned, negative spent
  title: string
  listing: string
  date: Date
}

/**
 * A member's UnSwap Credits from the confirmed CreditTransaction ledger.
 * Host earns on a completed credits swap (1.5× for short-term); requester spends.
 */
export async function getCreditsLedger(userId: string) {
  const txns = await prisma.creditTransaction.findMany({
    where: { userId, status: "confirmed" },
    orderBy: { createdAt: "desc" },
  })

  const swapIds = [...new Set(txns.map((t) => t.swapId).filter(Boolean) as string[])]
  const swaps = await prisma.swapRequest.findMany({
    where: { id: { in: swapIds } },
    include: { host: { select: { fullName: true } }, requester: { select: { fullName: true } }, listing: { select: { title: true } } },
  })
  const byId = new Map(swaps.map((s) => [s.id, s]))

  const transactions: CreditTxn[] = txns.map((t) => {
    const s = t.swapId ? byId.get(t.swapId) : null
    const earned = t.type === "earned"
    // Free-credit grants carry a `reason` and no swap — label them nicely.
    const grantTitle = t.reason && t.reason in CREDIT_GRANTS ? CREDIT_GRANTS[t.reason as GrantReason].title : null
    return {
      id: t.id,
      type: earned ? "earned" : "spent",
      amount: earned ? t.amount : -t.amount,
      title: s
        ? earned ? `Hosted ${s.requester.fullName}` : `Stayed with ${s.host.fullName}`
        : grantTitle ?? (earned ? "Credits earned" : "Credits spent"),
      listing: s?.listing.title ?? "—",
      date: t.createdAt,
    }
  })

  const earned = txns.filter((t) => t.type === "earned").reduce((a, t) => a + t.amount, 0)
  const spent = txns.filter((t) => t.type === "spent").reduce((a, t) => a + t.amount, 0)
  return { balance: earned - spent, earned, spent, transactions }
}
