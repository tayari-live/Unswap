"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"

const DUTY_STATIONS = [
  "New York", "Geneva", "Vienna", "Nairobi", "Rome", "Paris",
  "The Hague", "Bangkok", "Santiago", "Beirut", "Addis Ababa", "Dakar",
]
const PROPERTY_TYPES = ["Apartment", "House", "Villa", "Studio", "Townhouse"]

export type BrowseFilters = {
  q: string
  propertyType: string
  bedrooms: string
  guests: string
  exchangeType: string
  savedOnly: boolean
}

const selectCls =
  "px-3 py-2 border border-[var(--border)] rounded-xl bg-white text-sm text-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"

export function BrowseControls({ initial }: { initial: BrowseFilters }) {
  const router = useRouter()
  const [f, setF] = useState<BrowseFilters>(initial)

  function apply(next: Partial<BrowseFilters>) {
    const merged = { ...f, ...next }
    setF(merged)
    const qs = new URLSearchParams()
    if (merged.q) qs.set("q", merged.q)
    if (merged.propertyType) qs.set("type", merged.propertyType)
    if (merged.bedrooms) qs.set("beds", merged.bedrooms)
    if (merged.guests) qs.set("guests", merged.guests)
    if (merged.exchangeType) qs.set("exchange", merged.exchangeType)
    if (merged.savedOnly) qs.set("saved", "1")
    router.push(`/dashboard/browse${qs.toString() ? `?${qs}` : ""}`)
  }

  const hasFilters =
    f.q || f.propertyType || f.bedrooms || f.guests || f.exchangeType || f.savedOnly

  return (
    <div className="space-y-4 mb-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          apply({})
        }}
        className="relative"
      >
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral pointer-events-none" />
        <input
          value={f.q}
          onChange={(e) => setF({ ...f, q: e.target.value })}
          placeholder="Search by city, country, or duty station"
          className="w-full pl-11 pr-4 py-3 border border-[var(--border)] rounded-xl bg-white text-sm text-[var(--navy)] placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"
        />
      </form>

      {/* Duty-station quick chips */}
      <div className="flex flex-wrap gap-2">
        {DUTY_STATIONS.map((c) => (
          <button
            key={c}
            onClick={() => apply({ q: c })}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              f.q === c
                ? "bg-[var(--navy)] text-white border-[var(--navy)]"
                : "bg-white text-neutral-dark border-[var(--border)] hover:border-[var(--navy)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={f.propertyType} onChange={(e) => apply({ propertyType: e.target.value })} className={selectCls}>
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={f.bedrooms} onChange={(e) => apply({ bedrooms: e.target.value })} className={selectCls}>
          <option value="">Any beds</option>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+ beds</option>)}
        </select>
        <select value={f.guests} onChange={(e) => apply({ guests: e.target.value })} className={selectCls}>
          <option value="">Any guests</option>
          {[1, 2, 4, 6].map((n) => <option key={n} value={n}>{n}+ guests</option>)}
        </select>
        <select value={f.exchangeType} onChange={(e) => apply({ exchangeType: e.target.value })} className={selectCls}>
          <option value="">Any exchange</option>
          <option value="simultaneous">Simultaneous</option>
          <option value="credits">Credits</option>
        </select>
        <button
          onClick={() => apply({ savedOnly: !f.savedOnly })}
          className={`text-sm font-semibold px-3 py-2 rounded-xl border transition-colors ${
            f.savedOnly
              ? "bg-[var(--crimson)]/10 text-[var(--crimson)] border-[var(--crimson)]/30"
              : "bg-white text-neutral-dark border-[var(--border)] hover:border-[var(--navy)]"
          }`}
        >
          Saved only
        </button>
        {hasFilters && (
          <button
            onClick={() => {
              setF({ q: "", propertyType: "", bedrooms: "", guests: "", exchangeType: "", savedOnly: false })
              router.push("/dashboard/browse")
            }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-neutral hover:text-[var(--navy)]"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>
    </div>
  )
}
