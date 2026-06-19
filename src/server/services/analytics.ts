import { prisma } from "@/server/prisma"

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// Build the last `n` month buckets (oldest → newest) as { key, label }.
function lastMonths(n: number) {
  const out: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ key: monthKey(d), label: d.toLocaleDateString(undefined, { month: "short" }) })
  }
  return out
}

export async function getAnalytics() {
  const [members, swaps, subscriptions, listings, verifications] = await Promise.all([
    prisma.user.findMany({ where: { role: "member" }, select: { createdAt: true } }),
    prisma.swapRequest.findMany({ select: { createdAt: true, status: true } }),
    prisma.subscription.findMany({ where: { status: "active" }, select: { tier: true } }),
    prisma.listing.findMany({ select: { city: true } }),
    prisma.verificationSubmission.findMany({ select: { createdAt: true, status: true } }),
  ])

  const buckets = lastMonths(6)
  const series = buckets.map((b) => ({
    month: b.label,
    signups: members.filter((m) => monthKey(new Date(m.createdAt)) === b.key).length,
    swaps: swaps.filter((s) => monthKey(new Date(s.createdAt)) === b.key).length,
    verifications: verifications.filter((v) => v.status === "APPROVED" && monthKey(new Date(v.createdAt)) === b.key).length,
  }))

  const tierCounts = new Map<string, number>()
  for (const s of subscriptions) tierCounts.set(s.tier, (tierCounts.get(s.tier) ?? 0) + 1)
  const tierDistribution = [...tierCounts.entries()].map(([tier, count]) => ({ tier, count }))

  const stationCounts = new Map<string, number>()
  for (const l of listings) stationCounts.set(l.city, (stationCounts.get(l.city) ?? 0) + 1)
  const topStations = [...stationCounts.entries()]
    .map(([station, count]) => ({ station, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  return { series, tierDistribution, topStations }
}
