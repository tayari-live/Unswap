import Link from "next/link"
import { redirect } from "next/navigation"
import { MapPin, Star, BadgeCheck, SearchX, ChevronLeft, ChevronRight, MailWarning } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { searchListings } from "@/server/services/discovery"
import { PageHeader } from "@/components/ui/page-header"
import { BrowseControls } from "./browse-controls"
import { FavouriteButton } from "./favourite-button"
import { ResendMyVerification } from "./confirm-email-gate"

export const dynamic = "force-dynamic"

const EXCHANGE_LABEL: Record<string, string> = {
  simultaneous: "Simultaneous",
  credits: "Credits",
  either: "Simultaneous or credits",
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
  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, verificationStatus: true },
  })
  if (viewer?.verificationStatus === "PENDING_EMAIL") {
    return (
      <div className="max-w-2xl mx-auto pb-12">
        <PageHeader title="Discover Homes" subtitle="Browse verified homes across the network." />
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--parchment)] text-[var(--gold-dark)] flex items-center justify-center mb-5">
            <MailWarning size={26} />
          </div>
          <h2 className="font-display text-2xl font-bold text-[var(--navy)]">Confirm your email to browse</h2>
          <p className="mt-3 text-neutral leading-relaxed max-w-md mx-auto">
            Member homes are only visible inside the verified network. Open the
            confirmation link we sent to{" "}
            <span className="font-semibold text-[var(--navy)]">{viewer.email}</span>{" "}
            and this page unlocks instantly.
          </p>
          <div className="mt-7">
            <ResendMyVerification email={viewer.email} />
          </div>
        </div>
      </div>
    )
  }

  const sp = await searchParams
  const filters = {
    q: sp.q ?? "",
    propertyType: sp.type ?? "",
    bedrooms: sp.beds ?? "",
    guests: sp.guests ?? "",
    exchangeType: sp.exchange ?? "",
    savedOnly: sp.saved === "1",
  }

  const { items: listings, total, page, pageCount } = await searchListings({
    viewerId: userId,
    q: filters.q,
    propertyType: filters.propertyType || undefined,
    bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
    guests: filters.guests ? Number(filters.guests) : undefined,
    exchangeType: filters.exchangeType || undefined,
    savedOnly: filters.savedOnly,
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
    if (n > 1) qs.set("page", String(n))
    return `/dashboard/browse${qs.toString() ? `?${qs}` : ""}`
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PageHeader title="Discover Homes" subtitle="Browse verified homes across the network." />
      <BrowseControls initial={filters} />

      <p className="text-sm text-neutral mb-4">
        {total} {total === 1 ? "home" : "homes"}{filters.savedOnly ? " saved" : " available"}
      </p>

      {listings.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-neutral-light text-neutral flex items-center justify-center mb-4">
            <SearchX size={26} />
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">No homes match</h2>
          <p className="mt-2 text-sm text-neutral">Try a different city or relax your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/dashboard/browse/${l.id}`}
              className="group bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden hover:shadow-md hover:border-[var(--gold)]/50 transition-all"
            >
              <div className="relative h-44 bg-[var(--background)]">
                {l.photoId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/photos/${l.photoId}`} alt={l.title} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral/30">
                    <MapPin size={30} />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <FavouriteButton listingId={l.id} initial={l.favourited} />
                </div>
                {l.owner.verificationStatus === "FULLY_VERIFIED" && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-white/90 text-[var(--navy)] px-2.5 py-1 rounded-full">
                    <BadgeCheck size={12} className="text-[var(--teal)]" /> Verified host
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-neutral">
                  <MapPin size={13} /> {l.city}, {l.country}
                </div>
                <h3 className="mt-1 font-display font-bold text-[var(--navy)] leading-snug">{l.title}</h3>
                <div className="mt-1 text-xs text-neutral">
                  {l.propertyType} · {l.bedrooms} {l.bedrooms === 1 ? "bed" : "beds"} · up to {l.maxGuests} guests
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-xs text-neutral">{EXCHANGE_LABEL[l.exchangeType] ?? l.exchangeType}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-[var(--navy)]">
                    <Star size={12} className="text-[var(--gold)]" />
                    {l.owner.trustScore != null ? l.owner.trustScore.toFixed(1) : "New"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--navy)] px-4 py-2 rounded-xl border border-[var(--border)] hover:border-[var(--navy)] transition-colors">
              <ChevronLeft size={15} /> Previous
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral/40 px-4 py-2 rounded-xl border border-[var(--border)] cursor-not-allowed">
              <ChevronLeft size={15} /> Previous
            </span>
          )}
          <span className="text-sm text-neutral">Page {page} of {pageCount}</span>
          {page < pageCount ? (
            <Link href={pageHref(page + 1)} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--navy)] px-4 py-2 rounded-xl border border-[var(--border)] hover:border-[var(--navy)] transition-colors">
              Next <ChevronRight size={15} />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral/40 px-4 py-2 rounded-xl border border-[var(--border)] cursor-not-allowed">
              Next <ChevronRight size={15} />
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
