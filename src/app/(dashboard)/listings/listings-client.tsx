"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { MapPin, BedDouble, Bath, Users, Flag, Star } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge, Badge } from "@/components/ui/badges"

type Listing = {
  id: string
  title: string
  propertyType: string
  city: string
  country: string
  bedrooms: number
  bathrooms: number
  maxGuests: number
  status: string
  flagged: boolean
  rating: number | null
  primaryPhotoUrl: string | null
  exchangeType: string
  owner: { fullName: string; avatarInitials: string; organisation: string | null }
}

const STATUS_FILTERS = ["all", "ACTIVE", "PAUSED", "DRAFT", "ARCHIVED"]

export default function ListingsClient({ initialListings }: { initialListings: Listing[] }) {
  const router = useRouter()
  const [listings, setListings] = useState(initialListings)
  const [filter, setFilter] = useState("all")
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(
    () => (filter === "all" ? listings : listings.filter((l) => l.status === filter)),
    [listings, filter]
  )

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...body } as Listing : l)))
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PageHeader title="Listings" subtitle="All member home listings. Flag for moderation, pause, or archive." />

      <div className="flex gap-1 bg-surface border border-[var(--border)] rounded-xl p-1 mb-5 w-fit">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              filter === f ? "bg-[var(--navy)] text-white" : "text-neutral-dark hover:bg-neutral-light"
            }`}
          >
            {f === "all" ? "All" : f.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((l) => (
          <div key={l.id} className={`bg-surface rounded-2xl border shadow-sm overflow-hidden ${l.flagged ? "border-[var(--crimson)]" : "border-[var(--border)]"}`}>
            <div className="relative h-36 bg-neutral-light">
              {l.primaryPhotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.primaryPhotoUrl} alt={l.title} className="h-full w-full object-cover" />
              )}
              <div className="absolute top-2 left-2"><StatusBadge status={l.status} /></div>
              {l.flagged && <div className="absolute top-2 right-2"><Badge tone="crimson"><Flag size={11} /> Flagged</Badge></div>}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-[var(--navy)] leading-snug">{l.title}</h3>
                {l.rating != null && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[var(--navy)] flex-shrink-0">
                    <Star size={12} className="text-[var(--gold)] fill-[var(--gold)]" /> {l.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral flex items-center gap-1 mt-1">
                <MapPin size={12} /> {l.city}, {l.country}
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-neutral-dark">
                <span className="flex items-center gap-1"><BedDouble size={13} /> {l.bedrooms}</span>
                <span className="flex items-center gap-1"><Bath size={13} /> {l.bathrooms}</span>
                <span className="flex items-center gap-1"><Users size={13} /> {l.maxGuests}</span>
                <span className="text-neutral">· {l.propertyType}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                <span className="w-7 h-7 rounded-lg bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-[10px] font-bold">
                  {l.owner.avatarInitials}
                </span>
                <span className="text-xs text-neutral-dark truncate">{l.owner.fullName}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => patch(l.id, { flagged: !l.flagged })}
                  disabled={busyId === l.id}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition disabled:opacity-50 ${
                    l.flagged
                      ? "border-[var(--border)] text-neutral-dark hover:bg-neutral-light"
                      : "border-[var(--crimson)] text-[var(--crimson)] hover:bg-[var(--crimson)]/10"
                  }`}
                >
                  {l.flagged ? "Unflag" : "Flag"}
                </button>
                {l.status === "ACTIVE" ? (
                  <button onClick={() => patch(l.id, { status: "PAUSED" })} disabled={busyId === l.id} className="flex-1 text-xs font-semibold py-2 rounded-lg border border-[var(--border)] text-neutral-dark hover:bg-neutral-light transition disabled:opacity-50">Pause</button>
                ) : l.status === "ARCHIVED" ? (
                  <button onClick={() => patch(l.id, { status: "ACTIVE" })} disabled={busyId === l.id} className="flex-1 text-xs font-semibold py-2 rounded-lg border border-[var(--teal)] text-[var(--teal)] hover:bg-[var(--teal)]/10 transition disabled:opacity-50">Restore</button>
                ) : (
                  <button onClick={() => patch(l.id, { status: "ACTIVE" })} disabled={busyId === l.id} className="flex-1 text-xs font-semibold py-2 rounded-lg border border-[var(--teal)] text-[var(--teal)] hover:bg-[var(--teal)]/10 transition disabled:opacity-50">Activate</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full bg-surface rounded-2xl border border-[var(--border)] p-10 text-center text-sm text-neutral">No listings in this view.</div>
        )}
      </div>
    </div>
  )
}
