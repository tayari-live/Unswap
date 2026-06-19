import { prisma } from "@/server/prisma"

function nights(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000))
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
 * Derive a member's UnSwap Credits from completed credit-mode swaps.
 * 1 night hosted = 1 credit earned; 1 night stayed = 1 credit spent.
 */
export async function getCreditsLedger(userId: string) {
  const swaps = await prisma.swapRequest.findMany({
    where: {
      status: "COMPLETED",
      mode: "credits",
      OR: [{ hostId: userId }, { requesterId: userId }],
    },
    include: {
      host: { select: { fullName: true } },
      requester: { select: { fullName: true } },
      listing: { select: { title: true } },
    },
    orderBy: [{ completedAt: "desc" }, { endDate: "desc" }],
  })

  const transactions: CreditTxn[] = swaps.map((s) => {
    const earned = s.hostId === userId
    const n = nights(s.startDate, s.endDate)
    return {
      id: s.id,
      type: earned ? "earned" : "spent",
      amount: earned ? n : -n,
      title: earned ? `Hosted ${s.requester.fullName}` : `Stayed with ${s.host.fullName}`,
      listing: s.listing.title,
      date: s.completedAt ?? s.endDate,
    }
  })

  const earned = transactions.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0)
  const spent = transactions.filter((t) => t.amount < 0).reduce((a, t) => a - t.amount, 0)
  return { balance: earned - spent, earned, spent, transactions }
}
