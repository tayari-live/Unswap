import Link from "next/link"
import { redirect } from "next/navigation"
import {
  MapPin, Star, BadgeCheck, BedDouble, Bath, Users, ShieldAlert, ChevronRight,
} from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { getListingDetail } from "@/server/services/discovery"
import { listReviewsForListing } from "@/server/services/reviews"
import { FavouriteButton } from "../favourite-button"
import { ReportButton } from "@/components/report-button"
import { SwapRequestForm } from "./swap-request-form"
import { PhotoGallery } from "./photo-gallery"
import { MessageButton } from "../../messages/message-button"

export const dynamic = "force-dynamic"

const EXCHANGE_LABEL: Record<string, string> = {
  simultaneous: "Simultaneous only",
  credits: "Credits only",
  either: "Simultaneous or credits",
}
const DURATION_LABEL: Record<string, string> = {
  short_term: "Short-term", medium_term: "Medium-term", long_term: "Long-term", extended: "Extended rotation",
}
const AMENITY_LABEL: Record<string, string> = {
  wifi: "Wi-Fi", home_office: "Home office", parking: "Parking", garden: "Garden", pool: "Pool", dishwasher: "Dishwasher",
  washing_machine: "Washing machine", air_conditioning: "Air conditioning", lift: "Lift access", pet_friendly: "Pet-friendly", accessible: "Accessible",
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const { id } = await params
  const [viewer, listing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getListingDetail(userId, id),
  ])
  // Walled garden: listing details require a confirmed email. The browse page
  // shows the confirm-email explainer, so send unconfirmed members there.
  if (viewer?.verificationStatus === "PENDING_EMAIL") redirect("/dashboard/browse")
  if (!listing) redirect("/dashboard/browse")

  const reviews = await listReviewsForListing(listing.id)
  const isOwner = listing.ownerId === userId
  const canRequest = viewer?.verificationStatus === "FULLY_VERIFIED" && !isOwner

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Breadcrumb — each crumb is a live browse filter */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-neutral">
        <Link href="/dashboard/browse" className="hover:text-[var(--navy)] transition-colors">Discover</Link>
        <ChevronRight size={14} className="text-neutral/50" />
        <Link href={`/dashboard/browse?q=${encodeURIComponent(listing.country)}`} className="hover:text-[var(--navy)] transition-colors">
          {listing.country}
        </Link>
        <ChevronRight size={14} className="text-neutral/50" />
        <Link href={`/dashboard/browse?q=${encodeURIComponent(listing.city)}`} className="font-semibold text-[var(--navy)]">
          {listing.city}
        </Link>
      </nav>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <PhotoGallery
              photos={listing.photos.map((p) => ({ url: `/api/photos/${p.id}`, caption: p.caption }))}
              title={listing.title}
            />
            <div className="absolute top-4 right-4 z-10">
              <FavouriteButton listingId={listing.id} initial={listing.favourited} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-sm text-neutral">
              <MapPin size={15} /> {listing.neighbourhood ? `${listing.neighbourhood}, ` : ""}{listing.city}, {listing.country}
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold text-[var(--navy)]">{listing.title}</h1>
            <div className="mt-4 flex flex-wrap gap-5 text-sm text-neutral-dark">
              <span className="inline-flex items-center gap-1.5"><BedDouble size={16} className="text-neutral" /> {listing.bedrooms} {listing.bedrooms === 1 ? "bedroom" : "bedrooms"}</span>
              <span className="inline-flex items-center gap-1.5"><Bath size={16} className="text-neutral" /> {listing.bathrooms} {listing.bathrooms === 1 ? "bathroom" : "bathrooms"}</span>
              <span className="inline-flex items-center gap-1.5"><Users size={16} className="text-neutral" /> up to {listing.maxGuests} guests</span>
            </div>
          </div>

          {listing.description && (
            <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
              <h2 className="font-display font-bold text-lg text-[var(--navy)] mb-2">About this home</h2>
              <p className="text-sm text-neutral-dark leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>
          )}

          <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--navy)] mb-1">{listing.propertyType}</h2>
              <p className="text-sm text-neutral">Exchange preference: {EXCHANGE_LABEL[listing.exchangeType] ?? listing.exchangeType}</p>
            </div>
            {listing.swapDurations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.swapDurations.map((d) => (
                  <span key={d} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--navy)]/10 text-[var(--navy)]">{DURATION_LABEL[d] ?? d}</span>
                ))}
              </div>
            )}
            {listing.amenities.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--navy)] mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((a) => (
                    <span key={a} className="text-xs px-2.5 py-1 rounded-full bg-neutral-light text-neutral-dark">{AMENITY_LABEL[a] ?? a}</span>
                  ))}
                </div>
              </div>
            )}
            {listing.houseRules && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--navy)] mb-1">House rules</h3>
                <p className="text-sm text-neutral-dark whitespace-pre-line">{listing.houseRules}</p>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-[var(--navy)]">Reviews</h2>
              {listing.rating != null && (
                <span className="flex items-center gap-1 text-sm font-bold text-[var(--navy)]">
                  <Star size={15} className="text-[var(--gold)]" fill="currentColor" />
                  {listing.rating.toFixed(1)} · {reviews.length}
                </span>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-neutral">No reviews yet for this home.</p>
            ) : (
              <div className="space-y-5">
                {reviews.map((rv) => (
                  <div key={rv.id} className="border-b border-[var(--border)] last:border-0 pb-5 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-xs font-bold">
                          {rv.author.avatarInitials}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-[var(--navy)]">{rv.author.fullName}</div>
                          <div className="text-xs text-neutral">{rv.author.organisation ?? ""}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={13} className={rv.overall >= n ? "text-[var(--gold)]" : "text-[var(--border)]"} fill={rv.overall >= n ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2.5 text-sm text-neutral-dark leading-relaxed">{rv.body}</p>
                    <div className="mt-2"><ReportButton targetType="review" targetId={rv.id} variant="link" /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Host card */}
          <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center font-bold">
                {listing.owner.avatarInitials}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-[var(--navy)]">{listing.owner.fullName}</span>
                  {listing.owner.verificationStatus === "FULLY_VERIFIED" && (
                    <BadgeCheck size={15} className="text-[var(--teal)]" />
                  )}
                </div>
                <div className="text-xs text-neutral">{listing.owner.organisation ?? ""}{listing.owner.dutyStation ? ` · ${listing.owner.dutyStation}` : ""}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm border-t border-[var(--border)] pt-3">
              <span className="text-neutral">Trust score</span>
              <span className="flex items-center gap-1 font-bold text-[var(--navy)]">
                <Star size={14} className="text-[var(--gold)]" />
                {listing.owner.trustScore != null ? listing.owner.trustScore.toFixed(1) : "New host"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-neutral">Member since</span>
              <span className="font-semibold text-[var(--navy)]">{listing.owner.createdAt.getFullYear()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-neutral">Exchanges</span>
              <span className="font-semibold text-[var(--navy)]">
                {listing.ownerExchanges === 0 ? "First-time host" : listing.ownerExchanges}
              </span>
            </div>

            {/* Verification checklist — the walled garden, made visible */}
            <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-dark">
                <BadgeCheck size={15} className="text-[var(--teal)] flex-shrink-0" />
                Institutional email verified
              </div>
              {listing.owner.verificationStatus === "FULLY_VERIFIED" && (
                <div className="flex items-center gap-2 text-sm text-neutral-dark">
                  <BadgeCheck size={15} className="text-[var(--teal)] flex-shrink-0" />
                  Staff ID &amp; employment verified
                </div>
              )}
            </div>

            {listing.owner.bio && <p className="mt-3 text-xs text-neutral-dark leading-relaxed">{listing.owner.bio}</p>}
          </div>

          {/* Request action */}
          {isOwner ? (
            <div className="bg-[var(--parchment)] border border-[var(--gold)]/20 rounded-2xl p-4 text-sm text-neutral-dark text-center">
              This is your own listing.
            </div>
          ) : canRequest ? (
            <div className="space-y-3">
              <SwapRequestForm
                listingId={listing.id}
                exchangeType={listing.exchangeType}
                maxGuests={listing.maxGuests}
                swapDurations={listing.swapDurations}
                blackouts={listing.blackouts}
              />
              <MessageButton otherUserId={listing.owner.id} label="Message host" />
            </div>
          ) : (
            <div className="bg-[var(--parchment)] border border-[var(--gold)]/30 rounded-2xl p-5 text-center">
              <ShieldAlert size={22} className="mx-auto text-[var(--gold-dark)]" />
              <p className="mt-2 text-sm text-neutral-dark">Get verified to request a swap.</p>
              <Link href="/verify-identity" className="mt-3 inline-block text-sm font-semibold text-[var(--gold-dark)] underline">Verify now</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
