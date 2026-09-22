import { prisma } from "@/server/prisma"
import { getTrustScore } from "@/server/services/trust"
import { getAvailablePoints } from "@/server/services/points"
import { scoreMatch } from "@/lib/match"

export type RecommendedHome = {
  id: string
  title: string
  city: string
  country: string
  propertyType: string
  maxGuests: number
  exchangeType: string
  photoId: string | null
  perNight: number
  reasons: string[]
  locked: boolean
  score: number
}

const CANDIDATE_POOL = 60

/**
 * Personalised home recommendations for a member: rank other members' active
 * homes by the matching engine's signals (host trust, affordability against the
 * member's points, destination affinity, and the higher-value access gate).
 * Deterministic and fast — no per-request model call.
 */
export async function getRecommendedListings(userId: string, limit = 6): Promise<RecommendedHome[]> {
  const [trust, points, favs] = await Promise.all([
    getTrustScore(userId),
    getAvailablePoints(userId),
    prisma.favourite.findMany({ where: { userId }, select: { listingId: true } }),
  ])

  const favIds = favs.map((f) => f.listingId)
  const favListings = favIds.length
    ? await prisma.listing.findMany({ where: { id: { in: favIds } }, select: { city: true, country: true } })
    : []
  const favouriteLocations = [
    ...new Set(
      favListings
        .flatMap((l) => [l.city, l.country])
        .filter(Boolean)
        .map((s) => s.toLowerCase()),
    ),
  ]

  const candidates = await prisma.listing.findMany({
    where: { status: "ACTIVE", ownerId: { not: userId } },
    orderBy: { createdAt: "desc" },
    take: CANDIDATE_POOL,
    select: {
      id: true,
      title: true,
      city: true,
      country: true,
      propertyType: true,
      maxGuests: true,
      exchangeType: true,
      nightlyPoints: true,
      nightlyAdjustment: true,
      owner: { select: { verificationStatus: true, trustScore: true } },
      photos: { select: { id: true }, orderBy: { position: "asc" }, take: 1 },
    },
  })

  const viewer = { trustScore: trust.score, pointsBalance: points.balance, favouriteLocations }

  const ranked = candidates
    .map((c) => {
      const match = scoreMatch(viewer, {
        city: c.city,
        country: c.country,
        exchangeType: c.exchangeType,
        nightlyPoints: c.nightlyPoints,
        nightlyAdjustment: c.nightlyAdjustment,
        hasPhoto: c.photos.length > 0,
        ownerVerified: c.owner.verificationStatus === "FULLY_VERIFIED",
        ownerTrust: c.owner.trustScore,
      })
      return { c, match }
    })
    // Best match first; the access-gated homes naturally sink via their penalty.
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit)

  return ranked.map(({ c, match }) => ({
    id: c.id,
    title: c.title,
    city: c.city,
    country: c.country,
    propertyType: c.propertyType,
    maxGuests: c.maxGuests,
    exchangeType: c.exchangeType,
    photoId: c.photos[0]?.id ?? null,
    perNight: match.perNight,
    reasons: match.reasons,
    locked: match.locked,
    score: match.score,
  }))
}
