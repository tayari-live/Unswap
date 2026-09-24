import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { resolveCityCoords } from "@/server/services/geocode"

const OWNER_CARD = {
  select: {
    id: true,
    fullName: true,
    avatarInitials: true,
    organisation: true,
    trustScore: true,
    verificationStatus: true,
  },
} as const

export type SearchParams = {
  viewerId: string
  q?: string
  propertyType?: string
  bedrooms?: number
  guests?: number
  exchangeType?: string
  savedOnly?: boolean
  availableNow?: boolean
  page?: number
}

// A home is "Available Now" when it has an availability window active today or
// starting within the next 30 days.
const AVAILABLE_SOON_DAYS = 30

export const BROWSE_PAGE_SIZE = 12

/**
 * Browse ACTIVE listings owned by other members, with optional filters.
 * Paginated; each card carries only the fields it renders plus the primary
 * photo's id (served via /api/photos/:id) — never the photo bytes themselves.
 */
export async function searchListings(p: SearchParams) {
  const where: any = {
    status: "ACTIVE",
    ownerId: { not: p.viewerId },
  }

  if (p.q?.trim()) {
    const q = p.q.trim()
    where.OR = [
      { city: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { neighbourhood: { contains: q, mode: "insensitive" } },
    ]
  }
  if (p.propertyType) where.propertyType = p.propertyType
  // A listing open to "either" mode satisfies a specific-mode filter too.
  if (p.exchangeType) where.exchangeType = { in: [p.exchangeType, "either"] }
  if (p.bedrooms) where.bedrooms = { gte: p.bedrooms }
  if (p.guests) where.maxGuests = { gte: p.guests }

  const now = new Date()
  const soon = new Date(now.getTime() + AVAILABLE_SOON_DAYS * 86_400_000)
  if (p.availableNow) where.availability = { some: { startDate: { lte: soon }, endDate: { gte: now } } }

  const favs = await prisma.favourite.findMany({
    where: { userId: p.viewerId },
    select: { listingId: true },
  })
  const favSet = new Set(favs.map((f) => f.listingId))

  if (p.savedOnly) where.id = { in: [...favSet] }

  const page = Math.max(1, Math.floor(p.page ?? 1))
  const [total, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * BROWSE_PAGE_SIZE,
      take: BROWSE_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        propertyType: true,
        city: true,
        country: true,
        bedrooms: true,
        maxGuests: true,
        exchangeType: true,
        nightlyPoints: true,
        nightlyAdjustment: true,
        owner: OWNER_CARD,
        photos: { select: { id: true }, orderBy: { position: "asc" }, take: 1 },
        // Only the windows that make it "available now" — presence is the flag.
        availability: { where: { startDate: { lte: soon }, endDate: { gte: now } }, select: { id: true }, take: 1 },
      },
    }),
  ])

  return {
    items: listings.map(({ photos, availability, ...l }) => ({
      ...l,
      photoId: photos[0]?.id ?? null,
      availableNow: availability.length > 0,
      favourited: favSet.has(l.id),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / BROWSE_PAGE_SIZE)),
  }
}

export type CityPin = { city: string; country: string; count: number; lng: number; lat: number }

/**
 * Active listings grouped into CITY pins for the map view — a count per city at
 * the city centre, never a home's real location. Applies the same filters as
 * the grid so the two views stay in sync. Cities without known coordinates are
 * omitted from the map (they still appear in the list).
 */
export async function listingCityCounts(p: SearchParams): Promise<CityPin[]> {
  const where: any = { status: "ACTIVE", ownerId: { not: p.viewerId } }
  if (p.q?.trim()) {
    const q = p.q.trim()
    where.OR = [
      { city: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { neighbourhood: { contains: q, mode: "insensitive" } },
    ]
  }
  if (p.propertyType) where.propertyType = p.propertyType
  if (p.exchangeType) where.exchangeType = { in: [p.exchangeType, "either"] }
  if (p.bedrooms) where.bedrooms = { gte: p.bedrooms }
  if (p.guests) where.maxGuests = { gte: p.guests }
  if (p.availableNow) {
    const now = new Date()
    const soon = new Date(now.getTime() + AVAILABLE_SOON_DAYS * 86_400_000)
    where.availability = { some: { startDate: { lte: soon }, endDate: { gte: now } } }
  }

  const groups = await prisma.listing.groupBy({
    by: ["city", "country"],
    where,
    _count: { _all: true },
  })

  // Resolve each city's centre (built-in table → cache → Mapbox geocode), so
  // any city plots — not just the built-in duty stations. Unknown cities are
  // omitted from the map (they still appear in the grid/list).
  const pins = await Promise.all(
    groups.map(async (g) => {
      const coords = await resolveCityCoords(g.city, g.country)
      return coords ? { city: g.city, country: g.country, count: g._count._all, lng: coords[0], lat: coords[1] } : null
    }),
  )
  return pins
    .filter((x): x is CityPin => x !== null)
    .sort((a, b) => b.count - a.count)
}

/** A single listing for the detail view. Only ACTIVE listings are browsable. */
export async function getListingDetail(viewerId: string, id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          avatarInitials: true,
          organisation: true,
          dutyStation: true,
          nationality: true,
          bio: true,
          trustScore: true,
          verificationStatus: true,
          createdAt: true,
        },
      },
      photos: { select: { id: true, caption: true }, orderBy: { position: "asc" } },
      blackouts: { orderBy: { startDate: "asc" } },
      availability: { orderBy: { startDate: "asc" } },
    },
  })
  if (!listing) return null
  if (listing.status !== "ACTIVE" && listing.ownerId !== viewerId) return null

  const [fav, ownerExchanges] = await Promise.all([
    prisma.favourite.findUnique({
      where: { userId_listingId: { userId: viewerId, listingId: id } },
    }),
    // Completed exchanges the host has been part of, either side — the trust
    // sidebar's "n exchanges" figure.
    prisma.swapRequest.count({
      where: {
        status: "COMPLETED",
        OR: [{ hostId: listing.ownerId }, { requesterId: listing.ownerId }],
      },
    }),
  ])

  // Never expose the encrypted private fields to the public detail view.
  const { fullAddressEnc, emergencyNameEnc, emergencyPhoneEnc, emergencyRelationEnc, ...pub } = listing
  void fullAddressEnc; void emergencyNameEnc; void emergencyPhoneEnc; void emergencyRelationEnc
  return {
    ...pub,
    ownerExchanges,
    favourited: !!fav,
    amenities: listing.amenities ? listing.amenities.split(",").filter(Boolean) : [],
    swapDurations: listing.swapDurations ? listing.swapDurations.split(",").filter(Boolean) : [],
    blackouts: listing.blackouts.map((b) => ({
      start: b.startDate.toISOString().slice(0, 10),
      end: b.endDate.toISOString().slice(0, 10),
    })),
    availability: listing.availability.map((b) => ({
      start: b.startDate.toISOString().slice(0, 10),
      end: b.endDate.toISOString().slice(0, 10),
    })),
  }
}

/** Toggle a listing in the viewer's private favourites. */
export async function toggleFavourite(userId: string, listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) throw new ApiError(404, "Listing not found.")

  const existing = await prisma.favourite.findUnique({
    where: { userId_listingId: { userId, listingId } },
  })
  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } })
    return { favourited: false }
  }
  await prisma.favourite.create({ data: { userId, listingId } })
  return { favourited: true }
}
