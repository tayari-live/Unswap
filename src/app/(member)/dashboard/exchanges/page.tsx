import { redirect } from "next/navigation"
import {
  MapPin, Calendar, Users, FileDown, Home as HomeIcon, CalendarCheck,
} from "lucide-react"
import { auth } from "@/server/auth"
import { listMemberExchanges } from "@/server/services/swaps"
import { pendingReviewsFor } from "@/server/services/reviews"
import { PageHeader } from "@/components/ui/page-header"
import { ReviewAction } from "./review-action"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-[var(--teal)]/15 text-[var(--teal)]",
  IN_PROGRESS: "bg-[var(--teal)]/15 text-[var(--teal)]",
  COMPLETED: "bg-neutral-light text-neutral-dark",
}

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}
function nights(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000))
}

type Row = Awaited<ReturnType<typeof listMemberExchanges>>["upcoming"][number]

function ExchangeCard({ r, review }: { r: Row; review?: { aboutHost: boolean } }) {
  return (
    <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col sm:flex-row">
      <div className="relative sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-[var(--background)]">
        {r.listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/photos/${r.listing.photos[0].id}`} alt={r.listing.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral/30"><HomeIcon size={28} /></div>
        )}
      </div>
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--gold-dark)]">
              {r.role === "host" ? "You're hosting" : "You're staying"}
            </span>
            <h3 className="font-display text-lg font-bold text-[var(--navy)] leading-snug">{r.listing.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-neutral mt-0.5">
              <MapPin size={13} /> {r.listing.city}, {r.listing.country}
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLE[r.status] ?? STATUS_STYLE.CONFIRMED}`}>
            {r.status.replace("_", " ")}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-[10px] font-bold">{r.other.avatarInitials}</span>
            {r.role === "host" ? "Guest" : "Host"}: {r.other.fullName}
          </span>
          <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {fmt(r.startDate)} – {fmt(r.endDate)} · {nights(r.startDate, r.endDate)} nights</span>
          <span className="inline-flex items-center gap-1.5"><Users size={13} /> {r.guests} {r.guests === 1 ? "guest" : "guests"}</span>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
          <a
            href={`/api/swaps/${r.id}/agreement`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--navy)] bg-neutral-light hover:bg-[var(--border)] px-3 py-2 rounded-lg transition-colors"
          >
            <FileDown size={14} /> Download Swap Agreement
          </a>
          {review && (
            <ReviewAction swapId={r.id} aboutHost={review.aboutHost} otherName={r.other.fullName} />
          )}
        </div>
      </div>
    </div>
  )
}

export default async function ExchangesPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const [{ upcoming, past }, pending] = await Promise.all([
    listMemberExchanges(userId),
    pendingReviewsFor(userId),
  ])
  const reviewable = new Map(pending.map((p) => [p.swapId, p.aboutHost]))

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <PageHeader title="My Exchanges" subtitle="Your confirmed and completed home exchanges." />

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center mb-4">
            <CalendarCheck size={26} />
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">No exchanges yet</h2>
          <p className="mt-2 text-sm text-neutral">Once a swap request is accepted, it appears here with its agreement.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-lg text-[var(--navy)] mb-3">Upcoming & ongoing</h2>
              <div className="space-y-4">{upcoming.map((r) => <ExchangeCard key={r.id} r={r} />)}</div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-lg text-[var(--navy)] mb-3">Past exchanges</h2>
              <div className="space-y-4">{past.map((r) => (
                <ExchangeCard
                  key={r.id}
                  r={r}
                  review={reviewable.has(r.id) ? { aboutHost: reviewable.get(r.id)! } : undefined}
                />
              ))}</div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
