import { prisma } from "@/server/prisma"

const TIER_PRICES: Record<string, number> = {
  limited_1x: 129,
  standard_2x: 219,
  professional_4x: 349,
  unlimited_pro: 449,
  lifetime: 3143,
}

export type OverviewStats = {
  verifiedMembers: number
  pendingVerifications: number
  activeListings: number
  swapsInProgress: number
  swapsCompleted: number
  openDisputes: number
  waitlistCount: number
  mrr: number
  tierDistribution: { tier: string; count: number }[]
  topDutyStations: { station: string; count: number }[]
}

/** Aggregate the headline numbers for the admin overview. */
export async function getOverviewStats(): Promise<OverviewStats> {
  const [
    verifiedMembers,
    pendingVerifications,
    activeListings,
    swapsInProgress,
    swapsCompleted,
    openDisputes,
    waitlistCount,
    subscriptions,
    listings,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "member", verificationStatus: "FULLY_VERIFIED" } }),
    prisma.verificationSubmission.count({ where: { status: "PENDING" } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.swapRequest.count({ where: { status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] } } }),
    prisma.swapRequest.count({ where: { status: "COMPLETED" } }),
    prisma.swapRequest.count({ where: { disputed: true } }),
    prisma.waitlistEntry.count(),
    prisma.subscription.findMany({ where: { status: "active" }, select: { tier: true } }),
    prisma.listing.findMany({ select: { city: true } }),
  ])

  // Monthly recurring revenue from annual tiers (lifetime excluded — one-time).
  const mrr = Math.round(
    subscriptions
      .filter((s) => s.tier !== "lifetime")
      .reduce((sum, s) => sum + (TIER_PRICES[s.tier] ?? 0) / 12, 0)
  )

  const tierCounts = new Map<string, number>()
  for (const s of subscriptions) tierCounts.set(s.tier, (tierCounts.get(s.tier) ?? 0) + 1)
  const tierDistribution = [...tierCounts.entries()]
    .map(([tier, count]) => ({ tier, count }))
    .sort((a, b) => b.count - a.count)

  const stationCounts = new Map<string, number>()
  for (const l of listings) stationCounts.set(l.city, (stationCounts.get(l.city) ?? 0) + 1)
  const topDutyStations = [...stationCounts.entries()]
    .map(([station, count]) => ({ station, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  return {
    verifiedMembers,
    pendingVerifications,
    activeListings,
    swapsInProgress,
    swapsCompleted,
    openDisputes,
    waitlistCount,
    mrr,
    tierDistribution,
    topDutyStations,
  }
}
