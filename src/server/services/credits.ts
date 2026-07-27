import { prisma } from "@/server/prisma"

// Free-credit grants (1 credit = 1 night). Amounts are the single source of
// truth — tweak here to change the economy. `reason` is stored on the ledger
// row and drives both idempotency and the human label shown to members.
export const CREDIT_GRANTS = {
  welcome: { amount: 1, title: "Welcome bonus" },
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
