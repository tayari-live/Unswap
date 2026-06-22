import { prisma } from "@/server/prisma"

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
    return {
      id: t.id,
      type: earned ? "earned" : "spent",
      amount: earned ? t.amount : -t.amount,
      title: s
        ? earned ? `Hosted ${s.requester.fullName}` : `Stayed with ${s.host.fullName}`
        : earned ? "Credits earned" : "Credits spent",
      listing: s?.listing.title ?? "—",
      date: t.createdAt,
    }
  })

  const earned = txns.filter((t) => t.type === "earned").reduce((a, t) => a + t.amount, 0)
  const spent = txns.filter((t) => t.type === "spent").reduce((a, t) => a + t.amount, 0)
  return { balance: earned - spent, earned, spent, transactions }
}
