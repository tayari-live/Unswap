import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { encryptField, decryptField } from "@/server/crypto"

export function listListings() {
  return prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { fullName: true, avatarInitials: true, organisation: true } } },
  })
}

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]
const PROPERTY_TYPES = ["Apartment", "House", "Villa", "Studio", "Townhouse"]
const EXCHANGE_TYPES = ["simultaneous", "credits", "either"]
const WIFI_SPEEDS = ["under_50", "50_200", "200_plus", "gigabit"]
export const DURATION_TYPES = ["short_term", "medium_term", "long_term", "extended"]
export const AMENITIES = [
  "home_office", "parking", "garden", "pool", "dishwasher",
  "washing_machine", "air_conditioning", "lift", "pet_friendly", "accessible",
]
const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp);base64,/
const MAX_PHOTO_CHARS = 14_000_000 // ~10 MB encoded
const MIN_PHOTOS = 5
const MAX_PHOTOS = 20

// ---- Member-facing listing management (owner-scoped) -------------------------

export type PhotoInput = { url: string; caption?: string }
export type BlackoutInput = { startDate: string; endDate: string }
export type ListingInput = {
  title?: string
  propertyType?: string
  fullAddress?: string
  city?: string
  country?: string
  neighbourhood?: string
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
  description?: string
  wifiSpeed?: string
  amenities?: string[]
  photos?: PhotoInput[]
  swapDurations?: string[]
  exchangeType?: string
  blackouts?: BlackoutInput[]
  houseRules?: string
  emergencyName?: string
  emergencyPhone?: string
  emergencyRelationship?: string
  status?: string
}

/** All listings owned by a member, newest first (with photo count). */
export function listMemberListings(ownerId: string) {
  return prisma.listing.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true } } },
  })
}

/** Fetch one owned listing with photos/blackouts and decrypted private fields. */
export async function getMemberListing(ownerId: string, id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: { orderBy: { position: "asc" } }, blackouts: { orderBy: { startDate: "asc" } } },
  })
  if (!listing || listing.ownerId !== ownerId) throw new ApiError(404, "Listing not found.")
  return {
    ...listing,
    fullAddress: decryptField(listing.fullAddressEnc),
    emergencyName: decryptField(listing.emergencyNameEnc),
    emergencyPhone: decryptField(listing.emergencyPhoneEnc),
    emergencyRelationship: decryptField(listing.emergencyRelationEnc),
    amenities: listing.amenities ? listing.amenities.split(",").filter(Boolean) : [],
    swapDurations: listing.swapDurations ? listing.swapDurations.split(",").filter(Boolean) : [],
  }
}

function clampInt(v: unknown, fallback: number, min: number, max: number) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function cleanPhotos(photos: PhotoInput[] | undefined): PhotoInput[] {
  const list = photos ?? []
  if (list.length < MIN_PHOTOS) throw new ApiError(400, `At least ${MIN_PHOTOS} photos are required.`)
  if (list.length > MAX_PHOTOS) throw new ApiError(400, `A maximum of ${MAX_PHOTOS} photos is allowed.`)
  return list.map((p) => {
    if (!IMAGE_DATA_URL.test(p.url)) throw new ApiError(400, "Photos must be PNG, JPG, or WebP images.")
    if (p.url.length > MAX_PHOTO_CHARS) throw new ApiError(413, "A photo exceeds the 10 MB limit.")
    return { url: p.url, caption: p.caption?.trim().slice(0, 60) || undefined }
  })
}

function cleanBlackouts(blackouts: BlackoutInput[] | undefined) {
  return (blackouts ?? []).map((b) => {
    const start = new Date(b.startDate)
    const end = new Date(b.endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      throw new ApiError(400, "Each blackout range needs a valid start and end date.")
    }
    return { startDate: start, endDate: end }
  })
}

/** Validate the full listing payload (Step 6 pre-submission rules). */
function validateFull(input: ListingInput) {
  const title = input.title?.trim()
  const city = input.city?.trim()
  const country = input.country?.trim()
  if (!title) throw new ApiError(400, "A listing title is required.")
  if (title.length > 80) throw new ApiError(400, "Title must be 80 characters or fewer.")
  if (!input.propertyType || !PROPERTY_TYPES.includes(input.propertyType)) throw new ApiError(400, "Choose a valid property type.")
  if (!city) throw new ApiError(400, "City is required.")
  if (!country) throw new ApiError(400, "Country is required.")
  const description = input.description?.trim() ?? ""
  if (description.length < 100) throw new ApiError(400, "Description must be at least 100 characters.")
  if (!input.wifiSpeed || !WIFI_SPEEDS.includes(input.wifiSpeed)) throw new ApiError(400, "Select a Wi-Fi speed.")
  const amenities = (input.amenities ?? []).filter((a) => AMENITIES.includes(a))
  const durations = (input.swapDurations ?? []).filter((d) => DURATION_TYPES.includes(d))
  if (durations.length === 0) throw new ApiError(400, "Select at least one swap duration type.")
  if (input.exchangeType && !EXCHANGE_TYPES.includes(input.exchangeType)) throw new ApiError(400, "Choose a valid exchange preference.")
  if (!input.emergencyName?.trim() || !input.emergencyPhone?.trim()) throw new ApiError(400, "Emergency contact name and phone are required.")
  const photos = cleanPhotos(input.photos)
  const blackouts = cleanBlackouts(input.blackouts)
  return { title, city, country, description, amenities, durations, photos, blackouts }
}

/** The three upload gates: verified, 80% profile, active subscription. */
async function assertCanList(ownerId: string) {
  const owner = await prisma.user.findUnique({ where: { id: ownerId }, include: { subscription: true } })
  if (!owner) throw new ApiError(404, "Account not found.")
  if (owner.verificationStatus !== "FULLY_VERIFIED") throw new ApiError(403, "You must be fully verified to list a property.")
  if (owner.profileCompletion < 80) throw new ApiError(403, "Complete your profile to at least 80% to list a property.")
  if (!owner.subscription || owner.subscription.status !== "active") throw new ApiError(402, "An active subscription is required to list a property.")
  return owner
}

/** Create a listing (status DRAFT, or ACTIVE if requested and gates pass). */
export async function createListing(ownerId: string, input: ListingInput) {
  await assertCanList(ownerId)
  const v = validateFull(input)
  const status = input.status === "ACTIVE" ? "ACTIVE" : "DRAFT"

  const listing = await prisma.$transaction(async (tx) => {
    const created = await tx.listing.create({
      data: {
        ownerId,
        title: v.title,
        propertyType: input.propertyType!,
        city: v.city,
        country: v.country,
        neighbourhood: input.neighbourhood?.trim() || null,
        bedrooms: clampInt(input.bedrooms, 1, 1, 10),
        bathrooms: clampInt(input.bathrooms, 1, 1, 6),
        maxGuests: clampInt(input.maxGuests, 2, 1, 12),
        description: v.description,
        wifiSpeed: input.wifiSpeed,
        amenities: v.amenities.join(",") || null,
        swapDurations: v.durations.join(","),
        exchangeType: input.exchangeType || "either",
        houseRules: input.houseRules?.trim().slice(0, 1000) || null,
        primaryPhotoUrl: v.photos[0]?.url ?? null,
        status,
        fullAddressEnc: encryptField(input.fullAddress),
        emergencyNameEnc: encryptField(input.emergencyName),
        emergencyPhoneEnc: encryptField(input.emergencyPhone),
        emergencyRelationEnc: encryptField(input.emergencyRelationship),
        photos: { create: v.photos.map((p, i) => ({ url: p.url, caption: p.caption, position: i })) },
        blackouts: { create: v.blackouts },
      },
    })
    return created
  })

  await logAudit({ actorId: ownerId, action: "LISTING_CREATED", subject: listing.title })
  return listing
}

/** Update a member's own listing: a status change, or a full edit. */
export async function updateMemberListing(ownerId: string, id: string, input: ListingInput) {
  const existing = await prisma.listing.findUnique({
    where: { id },
    include: { _count: { select: { photos: true } } },
  })
  if (!existing || existing.ownerId !== ownerId) throw new ApiError(404, "Listing not found.")

  const isStatusOnly =
    input.status !== undefined && input.title === undefined && input.propertyType === undefined && input.photos === undefined

  if (input.status !== undefined && !STATUSES.includes(input.status)) throw new ApiError(400, "Invalid status.")

  // Publishing (going ACTIVE) requires the gates + minimum content.
  if (input.status === "ACTIVE" && existing.status !== "ACTIVE") {
    await assertCanList(ownerId)
    const photoCount = isStatusOnly ? existing._count.photos : (input.photos?.length ?? 0)
    const durations = isStatusOnly ? existing.swapDurations : (input.swapDurations ?? []).join(",")
    if (photoCount < MIN_PHOTOS) throw new ApiError(400, `At least ${MIN_PHOTOS} photos are required to publish.`)
    if (!durations) throw new ApiError(400, "Select at least one swap duration type to publish.")
  }

  if (isStatusOnly) {
    await prisma.listing.update({ where: { id }, data: { status: input.status } })
    await logAudit({ actorId: ownerId, action: "LISTING_UPDATED", subject: existing.title, metadata: { status: input.status } })
    return { ok: true }
  }

  const v = validateFull(input)
  await prisma.$transaction(async (tx) => {
    await tx.listingPhoto.deleteMany({ where: { listingId: id } })
    await tx.blackoutDate.deleteMany({ where: { listingId: id } })
    await tx.listing.update({
      where: { id },
      data: {
        title: v.title,
        propertyType: input.propertyType!,
        city: v.city,
        country: v.country,
        neighbourhood: input.neighbourhood?.trim() || null,
        bedrooms: clampInt(input.bedrooms, existing.bedrooms, 1, 10),
        bathrooms: clampInt(input.bathrooms, existing.bathrooms, 1, 6),
        maxGuests: clampInt(input.maxGuests, existing.maxGuests, 1, 12),
        description: v.description,
        wifiSpeed: input.wifiSpeed,
        amenities: v.amenities.join(",") || null,
        swapDurations: v.durations.join(","),
        exchangeType: input.exchangeType || existing.exchangeType,
        houseRules: input.houseRules?.trim().slice(0, 1000) || null,
        primaryPhotoUrl: v.photos[0]?.url ?? null,
        ...(input.status !== undefined ? { status: input.status } : {}),
        fullAddressEnc: encryptField(input.fullAddress),
        emergencyNameEnc: encryptField(input.emergencyName),
        emergencyPhoneEnc: encryptField(input.emergencyPhone),
        emergencyRelationEnc: encryptField(input.emergencyRelationship),
        photos: { create: v.photos.map((p, i) => ({ url: p.url, caption: p.caption, position: i })) },
        blackouts: { create: v.blackouts },
      },
    })
  })

  await logAudit({ actorId: ownerId, action: "LISTING_UPDATED", subject: existing.title })
  return { ok: true }
}

/** Permanently delete a member's own listing. */
export async function deleteMemberListing(ownerId: string, id: string) {
  const existing = await prisma.listing.findUnique({ where: { id } })
  if (!existing || existing.ownerId !== ownerId) throw new ApiError(404, "Listing not found.")
  await prisma.listing.delete({ where: { id } })
  await logAudit({ actorId: ownerId, action: "LISTING_DELETED", subject: existing.title })
  return { ok: true }
}

export async function updateListing(input: { actorId: string; id: string; status?: string; flagged?: boolean }) {
  const listing = await prisma.listing.findUnique({ where: { id: input.id } })
  if (!listing) throw new ApiError(404, "Listing not found.")
  if (input.status && !STATUSES.includes(input.status)) throw new ApiError(400, "Invalid status.")

  await prisma.listing.update({
    where: { id: input.id },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.flagged !== undefined ? { flagged: input.flagged } : {}),
    },
  })

  await logAudit({
    actorId: input.actorId,
    action: input.flagged !== undefined ? (input.flagged ? "LISTING_FLAGGED" : "LISTING_UNFLAGGED") : "LISTING_STATUS_CHANGED",
    subject: `${listing.title}`,
    metadata: { status: input.status, flagged: input.flagged },
  })
  return { ok: true }
}
