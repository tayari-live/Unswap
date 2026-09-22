import Link from "next/link"
import { MapPin, ChevronRight, Lock } from "lucide-react"
import { getRecommendedListings } from "@/server/services/matching"
import { MIN_SCORE_HIGH_VALUE } from "@/lib/trust"

const EXCHANGE_LABEL: Record<string, string> = {
  simultaneous: "Simultaneous",
  points: "Points",
  either: "Simultaneous or points",
}

/**
 * "Recommended For You" — real, personalised matches from the swap-matching
 * engine (replacing the old mock tiles). Server component: fetches its own
 * ranked homes. Renders nothing when there are no candidates yet.
 */
export async function RecommendedHomes({ userId }: { userId: string }) {
  const homes = await getRecommendedListings(userId, 6)
  if (homes.length === 0) return null

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em]">Recommended For You</h3>
        <Link href="/dashboard/browse" className="text-[13px] font-medium text-[var(--fg)]/70 hover:text-[var(--fg)] flex items-center gap-1 transition-colors">
          View all <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {homes.map((h) => (
          <Link
            key={h.id}
            href={`/dashboard/browse/${h.id}`}
            className="group flex flex-col bg-[var(--surface)] rounded-[10px] overflow-hidden border border-[var(--hair)] hover:border-[var(--gold)] transition-colors"
          >
            <div className="aspect-[4/3] bg-[var(--navy)]/5 relative overflow-hidden">
              {h.photoId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/photos/${h.photoId}`} alt={h.city} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--fg)]/20">
                  <MapPin size={30} />
                </div>
              )}
              {h.locked && (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-[var(--surface)]/90 text-[var(--fg)] px-2.5 py-1 rounded-full">
                  <Lock size={11} className="text-[var(--gold-dark)]" /> Unlocks at trust {MIN_SCORE_HIGH_VALUE}
                </span>
              )}
            </div>
            <div className="p-5">
              <h4 className="font-display text-[24px] font-bold text-[var(--fg)] leading-none mb-1">{h.city}</h4>
              <div className="font-sans text-[13px] text-[var(--fg)]/70 mb-2">{h.country}</div>
              <div className="font-sans text-[13px] text-[var(--fg)] font-medium">
                {h.exchangeType !== "simultaneous" ? (
                  <><span className="text-[var(--gold-dark)] font-semibold">{h.perNight}</span> points / night</>
                ) : (
                  EXCHANGE_LABEL[h.exchangeType] ?? h.exchangeType
                )}
                <span className="text-[var(--fg)]/50"> · up to {h.maxGuests} guests</span>
              </div>
              {h.reasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {h.reasons.map((r) => (
                    <span key={r} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--gold)]/12 text-[var(--gold-dark)]">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
