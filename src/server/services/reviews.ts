import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { sendEmail, renderEmail } from "@/server/email"
import { notifyAllowed } from "@/server/services/notify"

const APP = () => process.env.AUTH_URL || "http://localhost:3000"

const WINDOW_DAYS = 7
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000

function rating(v: unknown, field: string): number {
  const n = Math.round(Number(v))
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new ApiError(400, `${field} must be a rating from 1 to 5.`)
  return n
}

/** Recompute a member's trust score = mean of overall ratings received as host. */
export async function recomputeTrustScore(subjectId: string) {
  const agg = await prisma.review.aggregate({
    where: { subjectId, aboutHost: true },
    _avg: { overall: true },
  })
  await prisma.user.update({
    where: { id: subjectId },
    data: { trustScore: agg._avg.overall ?? null },
  })
}

/** Recompute a listing's rating = mean of host-review overalls for that listing. */
export async function recomputeListingRating(listingId: string) {
  const agg = await prisma.review.aggregate({
    where: { listingId, aboutHost: true },
    _avg: { overall: true },
  })
  await prisma.listing.update({
    where: { id: listingId },
    data: { rating: agg._avg.overall ?? null },
  })
}

export type CreateReviewInput = {
  authorId: string
  swapId: string
  overall: number
  communication: number
  propertyAccuracy?: number
  cleanliness?: number
  neighbourhoodSafety?: number
  body: string
}

/** Create a post-exchange review (one per party per completed swap, 7-day window). */
export async function createReview(input: CreateReviewInput) {
  const swap = await prisma.swapRequest.findUnique({ where: { id: input.swapId } })
  if (!swap) throw new ApiError(404, "Exchange not found.")
  if (swap.status !== "COMPLETED") throw new ApiError(409, "You can only review a completed exchange.")

  const isHost = swap.hostId === input.authorId
  const isRequester = swap.requesterId === input.authorId
  if (!isHost && !isRequester) throw new ApiError(403, "You are not part of this exchange.")

  // The author reviews the other party. aboutHost = author is the guest.
  const subjectId = isHost ? swap.requesterId : swap.hostId
  const aboutHost = subjectId === swap.hostId
  const listingId = aboutHost ? swap.listingId : null

  if (swap.completedAt && Date.now() > swap.completedAt.getTime() + WINDOW_MS) {
    throw new ApiError(409, `The ${WINDOW_DAYS}-day review window for this exchange has closed.`)
  }

  const existing = await prisma.review.findUnique({
    where: { swapId_authorId: { swapId: input.swapId, authorId: input.authorId } },
  })
  if (existing) throw new ApiError(409, "You've already reviewed this exchange.")

  const body = input.body?.trim() ?? ""
  if (body.length < 50) throw new ApiError(400, "Please write at least 50 characters.")

  const overall = rating(input.overall, "Overall rating")
  const communication = rating(input.communication, "Communication")
  const data: any = {
    swapId: input.swapId,
    authorId: input.authorId,
    subjectId,
    listingId,
    aboutHost,
    overall,
    communication,
    body,
  }
  // Property-specific sub-ratings only apply when reviewing the host's home.
  if (aboutHost) {
    data.propertyAccuracy = rating(input.propertyAccuracy, "Property accuracy")
    data.cleanliness = rating(input.cleanliness, "Cleanliness")
    data.neighbourhoodSafety = rating(input.neighbourhoodSafety, "Neighbourhood safety")
  }

  const review = await prisma.review.create({ data })

  await recomputeTrustScore(subjectId)
  if (aboutHost && listingId) await recomputeListingRating(listingId)

  // Notify the reviewed member.
  const [subject, author] = await Promise.all([
    prisma.user.findUnique({ where: { id: subjectId }, select: { email: true, firstName: true } }),
    prisma.user.findUnique({ where: { id: input.authorId }, select: { fullName: true } }),
  ])
  if (subject && author && (await notifyAllowed(subjectId, "reviews"))) {
    const stars = "★".repeat(overall) + "☆".repeat(5 - overall)
    await sendEmail({
      to: subject.email,
      subject: "You received a new review on UnSwap",
      html: renderEmail({
        heading: "New review received",
        body: `<p>Hello ${subject.firstName},</p><p><strong>${author.fullName}</strong> left you a review: <span style="color:#C9A84C">${stars}</span></p>`,
        ctaLabel: "View your reviews",
        ctaUrl: `${APP()}/dashboard/profile`,
      }),
    }).catch((e) => console.error("Review email failed:", e))
  }

  return review
}

/**
 * Completed exchanges the member can still review (within the window, not yet
 * reviewed by them). Used to surface review prompts.
 */
export async function pendingReviewsFor(userId: string) {
  const swaps = await prisma.swapRequest.findMany({
    where: { status: "COMPLETED", OR: [{ hostId: userId }, { requesterId: userId }] },
    include: {
      reviews: { where: { authorId: userId }, select: { id: true } },
      host: { select: { id: true, fullName: true, avatarInitials: true } },
      requester: { select: { id: true, fullName: true, avatarInitials: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { completedAt: "desc" },
  })

  return swaps
    .filter((s) => s.reviews.length === 0)
    .filter((s) => !s.completedAt || Date.now() <= s.completedAt.getTime() + WINDOW_MS)
    .map((s) => {
      const isHost = s.hostId === userId
      const other = isHost ? s.requester : s.host
      return {
        swapId: s.id,
        aboutHost: !isHost, // reviewing the host when the viewer is the guest
        other,
        listing: s.listing,
      }
    })
}

/** Public reviews of a listing (host reviews), newest first. */
export function listReviewsForListing(listingId: string) {
  return prisma.review.findMany({
    where: { listingId, aboutHost: true },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { fullName: true, avatarInitials: true, organisation: true } } },
  })
}

/** Reviews a member has received (for their profile). */
export function listReviewsForUser(subjectId: string) {
  return prisma.review.findMany({
    where: { subjectId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { fullName: true, avatarInitials: true, organisation: true } } },
  })
}
