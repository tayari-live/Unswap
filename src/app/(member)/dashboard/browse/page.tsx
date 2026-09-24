import Link from "next/link"
import { redirect } from "next/navigation"
import { MapPin, Star, BadgeCheck, SearchX, ChevronLeft, ChevronRight, Lock, CalendarClock } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { searchListings, listingCityCounts } from "@/server/services/discovery"
import { effectiveNightly } from "@/lib/valuation"
import { LuxPageHeader } from "@/components/ui/lux"
import { PageTip } from "@/components/ui/page-tip"
import { BrowseControls } from "./browse-controls"
import { BrowseMap } from "./browse-map"
import { FavouriteButton } from "./favourite-button"

export const dynamic = "force-dynamic"

const EXCHANGE_LABEL: Record<string, string> = {
  simultaneous: "Simultaneous",
  points: "Points",
  either: "Simultaneous or points",
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  // The network is a walled garden: browsing requires at least a confirmed
  // institutional email (EMAIL_VERIFIED). Full verification is only needed
  // later, to request or accept a swap.
  // The gate check and the URL filters are independent — resolve them together
  // so the page costs one round-trip instead of two.
  const [viewer, sp] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, verificationStatus: true },
    }),
    searchParams,
  ])
  // Progressive disclosure: members who aren't fully verified may browse, but
  // homes are shown as previews — photos blurred, host names and exact location
  // withheld — until they complete verification. Full clarity is a
  // FULLY_VERIFIED privilege.
  const blurred = viewer?.verificationStatus !== "FULLY_VERIFIED"
  const unconfirmed = viewer?.verificationStatus === "PENDING_EMAIL"

  const filters = {
    q: sp.q ?? "",
    propertyType: sp.type ?? "",
    bedrooms: sp.beds ?? "",
    guests: sp.guests ?? "",
    exchangeType: sp.exchange ?? "",
    savedOnly: sp.saved === "1",
    availableNow: sp.avail === "1",
    newOnly: sp.new === "1",
  }

  const { items: listings, total, page, pageCount } = await searchListings({
    viewerId: userId,
    q: filters.q,
    propertyType: filters.propertyType || undefined,
    bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
    guests: filters.guests ? Number(filters.guests) : undefined,
    exchangeType: filters.exchangeType || undefined,
    savedOnly: filters.savedOnly,
    availableNow: filters.availableNow,
    recentOnly: filters.newOnly,
    page: sp.page ? Number(sp.page) : 1,
  })

  // Pagination links keep the active filters and swap only the page number.
  const pageHref = (n: number) => {
    const qs = new URLSearchParams()
    if (filters.q) qs.set("q", filters.q)
    if (filters.propertyType) qs.set("type", filters.propertyType)
    if (filters.bedrooms) qs.set("beds", filters.bedrooms)
    if (filters.guests) qs.set("guests", filters.guests)
    if (filters.exchangeType) qs.set("exchange", filters.exchangeType)
    if (filters.savedOnly) qs.set("saved", "1")
    if (filters.availableNow) qs.set("avail", "1")
    if (filters.newOnly) qs.set("new", "1")
    if (n > 1) qs.set("page", String(n))
    return `/dashboard/browse${qs.toString() ? `?${qs}` : ""}`
  }

  // Grid ⇄ Map toggle, preserving the active filters.
  const isMap = sp.view === "map"
  const viewHref = (map: boolean) => {
    const qs = new URLSearchParams()
    if (filters.q) qs.set("q", filters.q)
    if (filters.propertyType) qs.set("type", filters.propertyType)
    if (filters.bedrooms) qs.set("beds", filters.bedrooms)
    if (filters.guests) qs.set("guests", filters.guests)
    if (filters.exchangeType) qs.set("exchange", filters.exchangeType)
    if (filters.savedOnly) qs.set("saved", "1")
    if (filters.availableNow) qs.set("avail", "1")
    if (filters.newOnly) qs.set("new", "1")
    if (map) qs.set("view", "map")
    return `/dashboard/browse${qs.toString() ? `?${qs}` : ""}`
  }
  // "Available now" toggle link — preserves filters + the current view.
  const availHref = (() => {
    const qs = new URLSearchParams()
    if (filters.q) qs.set("q", filters.q)
    if (filters.propertyType) qs.set("type", filters.propertyType)
    if (filters.bedrooms) qs.set("beds", filters.bedrooms)
    if (filters.guests) qs.set("guests", filters.guests)
    if (filters.exchangeType) qs.set("exchange", filters.exchangeType)
    if (filters.savedOnly) qs.set("saved", "1")
    if (!filters.availableNow) qs.set("avail", "1") // toggle on/off
    if (filters.newOnly) qs.set("new", "1")
    if (isMap) qs.set("view", "map")
    return `/dashboard/browse${qs.toString() ? `?${qs}` : ""}`
  })()
  const cityPins = isMap
    ? await listingCityCounts({
        viewerId: userId,
        q: filters.q,
        propertyType: filters.propertyType || undefined,
        bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
        guests: filters.guests ? Number(filters.guests) : undefined,
        exchangeType: filters.exchangeType || undefined,
        availableNow: filters.availableNow,
        recentOnly: filters.newOnly,
      })
    : []

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <LuxPageHeader eyebrow="The Portfolio" title="Discover Homes" subtitle="Browse verified homes across the network." />
      <PageTip id="discover">Every home here belongs to a verified peer. Save the ones you like, then send a swap request when your dates are set.</PageTip>

      {blurred && (
        <div className="sticky top-[72px] md:top-[76px] z-30 mb-4 flex items-start gap-3 rounded-md bg-[var(--gold)]/10 backdrop-blur-md border border-[var(--gold)]/30 px-4 py-3 shadow-sm">
          <Lock size={16} className="text-[var(--gold-dark)] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-neutral-dark leading-snug">
            <span className="font-semibold text-[var(--fg)]">You&apos;re viewing previews.</span>{" "}
            {unconfirmed
              ? "Confirm your email, then get verified to reveal photos, host details, and exact locations."
              : "Get verified to reveal photos, host details, and exact locations."}{" "}
            <Link href={unconfirmed ? "/dashboard" : "/verify-identity"} className="font-semibold text-[var(--gold-dark)] underline">
              {unconfirmed ? "Confirm email" : "Verify now"}
            </Link>
          </p>
        </div>
      )}

      <BrowseControls initial={filters} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-neutral">
          {isMap
            ? `${cityPins.length} ${cityPins.length === 1 ? "city" : "cities"} with homes`
            : `${total} ${total === 1 ? "home" : "homes"}${filters.savedOnly ? " saved" : filters.newOnly ? " added recently" : " available"}`}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={availHref}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${filters.availableNow ? "border-[var(--teal)]/40 bg-[var(--teal)]/10 text-[var(--teal)]" : "border-[var(--hair)] text-[var(--fg)] hover:border-[var(--teal)]/40"}`}
          >
            <CalendarClock size={14} /> Available now
          </Link>
          <div className="inline-flex rounded-lg border border-[var(--hair)] overflow-hidden text-sm">
            <Link href={viewHref(false)} className={`px-3.5 py-1.5 font-medium transition-colors ${!isMap ? "bg-[var(--navy)] text-white" : "text-[var(--fg)] hover:bg-[var(--gold)]/10"}`}>Grid</Link>
            <Link href={viewHref(true)} className={`px-3.5 py-1.5 font-medium transition-colors ${isMap ? "bg-[var(--navy)] text-white" : "text-[var(--fg)] hover:bg-[var(--gold)]/10"}`}>Map</Link>
          </div>
        </div>
      </div>

      {isMap ? (
        <BrowseMap pins={cityPins} />
      ) : listings.length === 0 ? (
        <div className="bg-surface rounded-md border border-[var(--hair)] p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-md bg-neutral-light text-neutral flex items-center justify-center mb-4">
            <SearchX size={26} />
          </div>
          <h2 className="font-sans text-xl font-semibold text-[var(--fg)]">No homes match</h2>
          <p className="mt-2 text-sm text-neutral">Try a different city or relax your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/dashboard/browse/${l.id}`}
              className="group bg-surface rounded-md border border-[var(--hair)] overflow-hidden hover:border-[var(--gold)]/50 transition-all"
            >
              <div className="relative h-44 bg-[var(--background)]">
                {l.photoId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/photos/${l.photoId}`} alt={blurred ? "Home preview" : l.title} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral/30">
                    <MapPin size={30} />
                  </div>
                )}
                {blurred && (
                  <span className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center pointer-events-none">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-[var(--surface)]/85 text-[var(--fg)] px-2.5 py-1 rounded-full">
                      <Lock size={11} className="text-[var(--gold-dark)]" /> Preview
                    </span>
                  </span>
                )}
                {l.availableNow && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-[var(--teal)] text-white px-2.5 py-1 rounded-full">
                    <CalendarClock size={11} /> Available now
                  </span>
                )}
                <div className="absolute top-3 right-3">
                  <FavouriteButton listingId={l.id} initial={l.favourited} />
                </div>
                {l.owner.verificationStatus === "FULLY_VERIFIED" && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-[var(--surface)]/90 text-[var(--fg)] px-2.5 py-1 rounded-full">
                    <BadgeCheck size={12} className="text-[var(--teal)]" /> Verified host
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-neutral">
                  <MapPin size={13} /> {l.city}, {l.country}
                </div>
                <h3 className="mt-1 font-sans font-semibold text-[var(--fg)] leading-snug">{l.title}</h3>
                <div className="mt-1 text-xs text-neutral">
                  {l.propertyType} · {l.bedrooms} {l.bedrooms === 1 ? "bed" : "beds"} · up to {l.maxGuests} guests
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--hair)] flex items-center justify-between">
                  <span className="text-xs text-neutral">
                    {l.exchangeType !== "simultaneous" ? (
                      <><span className="font-semibold text-[var(--gold-dark)]">{effectiveNightly(l.nightlyPoints, l.nightlyAdjustment)}</span> pts/night</>
                    ) : (EXCHANGE_LABEL[l.exchangeType] ?? l.exchangeType)}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-[var(--fg)]">
                    <Star size={12} className="text-[var(--gold)]" />
                    {l.owner.trustScore != null ? l.owner.trustScore.toFixed(1) : "New"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isMap && pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--fg)] px-4 py-2 rounded-xl border border-[var(--hair)] hover:border-[var(--navy)] transition-colors">
              <ChevronLeft size={15} /> Previous
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral/40 px-4 py-2 rounded-xl border border-[var(--hair)] cursor-not-allowed">
              <ChevronLeft size={15} /> Previous
            </span>
          )}
          <span className="text-sm text-neutral">Page {page} of {pageCount}</span>
          {page < pageCount ? (
            <Link href={pageHref(page + 1)} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--fg)] px-4 py-2 rounded-xl border border-[var(--hair)] hover:border-[var(--navy)] transition-colors">
              Next <ChevronRight size={15} />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral/40 px-4 py-2 rounded-xl border border-[var(--hair)] cursor-not-allowed">
              Next <ChevronRight size={15} />
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
