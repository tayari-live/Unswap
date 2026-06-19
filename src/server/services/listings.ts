import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"

export function listListings() {
  return prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { fullName: true, avatarInitials: true, organisation: true } } },
  })
}

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]
const PROPERTY_TYPES = ["Apartment", "House", "Villa", "Studio", "Townhouse"]
const EXCHANGE_TYPES = ["simultaneous", "credits", "either"]
const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp);base64,/
const MAX_PHOTO_CHARS = 8_000_000 // ~6 MB encoded

// ---- Member-facing listing management (owner-scoped) -------------------------

export type ListingInput = {
  title?: string
  propertyType?: string
  city?: string
  country?: string
  neighbourhood?: string
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
  description?: string
  primaryPhotoUrl?: string | null
  exchangeType?: string
  status?: string
}

/** All listings owned by a member, newest first. */
export function listMemberListings(ownerId: string) {
  return prisma.listing.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  })
}

/** Fetch one listing, enforcing ownership. */
export async function getMemberListing(ownerId: string, id: string) {
  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing || listing.ownerId !== ownerId) throw new ApiError(404, "Listing not found.")
  return listing
}

function clampInt(v: unknown, fallback: number, min: number, max: number) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function validatePhoto(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === "") return null
  if (!IMAGE_DATA_URL.test(value)) throw new ApiError(400, "Photo must be a PNG, JPG, or WebP image.")
  if (value.length > MAX_PHOTO_CHARS) throw new ApiError(413, "Photo is too large. Use an image under 5 MB.")
  return value
}

/** Validate the shared, required listing fields used on create and full edit. */
function validateCore(input: ListingInput) {
  const title = input.title?.trim()
  const city = input.city?.trim()
  const country = input.country?.trim()
  if (!title) throw new ApiError(400, "A listing title is required.")
  if (!input.propertyType || !PROPERTY_TYPES.includes(input.propertyType)) {
    throw new ApiError(400, "Choose a valid property type.")
  }
  if (!city) throw new ApiError(400, "City is required.")
  if (!country) throw new ApiError(400, "Country is required.")
  if (input.exchangeType && !EXCHANGE_TYPES.includes(input.exchangeType)) {
    throw new ApiError(400, "Choose a valid exchange preference.")
  }
  return { title, city, country }
}

async function assertCanPublish(ownerId: string) {
  const owner = await prisma.user.findUnique({ where: { id: ownerId } })
  if (owner?.verificationStatus !== "FULLY_VERIFIED") {
    throw new ApiError(403, "You must be fully verified before publishing a listing.")
  }
}

/** Create a listing owned by the member. Publishing requires full verification. */
export async function createListing(ownerId: string, input: ListingInput) {
  const { title, city, country } = validateCore(input)
  const status = input.status && STATUSES.includes(input.status) ? input.status : "DRAFT"
  if (status === "ACTIVE") await assertCanPublish(ownerId)
  const photo = validatePhoto(input.primaryPhotoUrl)

  const listing = await prisma.listing.create({
    data: {
      ownerId,
      title,
      propertyType: input.propertyType!,
      city,
      country,
      neighbourhood: input.neighbourhood?.trim() || null,
      bedrooms: clampInt(input.bedrooms, 1, 0, 50),
      bathrooms: clampInt(input.bathrooms, 1, 0, 50),
      maxGuests: clampInt(input.maxGuests, 2, 1, 50),
      description: input.description?.trim() || null,
      primaryPhotoUrl: photo ?? null,
      exchangeType: input.exchangeType || "either",
      status,
    },
  })

  await logAudit({ actorId: ownerId, action: "LISTING_CREATED", subject: listing.title })
  return listing
}

/** Update a member's own listing (full edit and/or status change). */
export async function updateMemberListing(ownerId: string, id: string, input: ListingInput) {
  const existing = await getMemberListing(ownerId, id)

  // A bare status change (e.g. pause/publish/archive) skips full-field validation.
  const isStatusOnly =
    input.status !== undefined &&
    input.title === undefined &&
    input.city === undefined &&
    input.country === undefined &&
    input.propertyType === undefined

  if (input.status !== undefined && !STATUSES.includes(input.status)) {
    throw new ApiError(400, "Invalid status.")
  }
  if (input.status === "ACTIVE" && existing.status !== "ACTIVE") {
    await assertCanPublish(ownerId)
  }

  let core: { title?: string; city?: string; country?: string } = {}
  let photo: string | null | undefined
  if (!isStatusOnly) {
    core = validateCore(input)
    photo = validatePhoto(input.primaryPhotoUrl)
  }

  await prisma.listing.update({
    where: { id },
    data: isStatusOnly
      ? { status: input.status }
      : {
          title: core.title,
          propertyType: input.propertyType!,
          city: core.city,
          country: core.country,
          neighbourhood: input.neighbourhood?.trim() || null,
          bedrooms: clampInt(input.bedrooms, existing.bedrooms, 0, 50),
          bathrooms: clampInt(input.bathrooms, existing.bathrooms, 0, 50),
          maxGuests: clampInt(input.maxGuests, existing.maxGuests, 1, 50),
          description: input.description?.trim() || null,
          ...(photo !== undefined ? { primaryPhotoUrl: photo } : {}),
          exchangeType: input.exchangeType || existing.exchangeType,
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
  })

  await logAudit({ actorId: ownerId, action: "LISTING_UPDATED", subject: existing.title, metadata: { status: input.status } })
  return { ok: true }
}

/** Permanently delete a member's own listing. */
export async function deleteMemberListing(ownerId: string, id: string) {
  const existing = await getMemberListing(ownerId, id)
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
