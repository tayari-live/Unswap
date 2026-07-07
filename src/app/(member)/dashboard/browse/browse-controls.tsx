"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X, SlidersHorizontal, Check } from "lucide-react"

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
  "w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-white text-sm text-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"

export function BrowseControls({ initial }: { initial: BrowseFilters }) {
  const router = useRouter()
  const [f, setF] = useState<BrowseFilters>(initial)
  const [showFilters, setShowFilters] = useState(false)

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
    <div className="space-y-3 mb-6 relative">
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            apply({})
          }}
          className="relative flex-1"
        >
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral pointer-events-none" />
          <input
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
            placeholder="Search by city, country, or duty station"
            className="w-full pl-11 pr-4 py-3 border border-[var(--border)] rounded-xl bg-white text-sm text-[var(--navy)] placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] transition-all shadow-sm"
          />
        </form>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-2 px-5 py-3 border rounded-xl text-sm font-bold transition-all shadow-sm ${
            showFilters || hasFilters
              ? "bg-[var(--navy)] border-[var(--navy)] text-white"
              : "bg-white border-[var(--border)] text-[var(--navy)] hover:border-[var(--navy)]"
          }`}
        >
          <SlidersHorizontal size={18} />
          Filters
          {hasFilters && !showFilters && (
            <span className="flex items-center justify-center w-5 h-5 ml-1 rounded-full bg-[var(--gold)] text-[var(--navy)] text-[10px]">
              <Check size={12} />
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="p-5 sm:p-6 bg-white border border-[var(--border)] rounded-2xl shadow-lg space-y-6 animate-in slide-in-from-top-2 fade-in duration-200">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral mb-3">Popular Duty Stations</h4>
            <div className="flex flex-wrap gap-2">
              {DUTY_STATIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => apply({ q: c })}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                    f.q === c
                      ? "bg-[var(--navy)] text-white border-[var(--navy)] shadow-md"
                      : "bg-surface text-neutral-dark border-[var(--border)] hover:border-[var(--navy)] hover:bg-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral">Property Type</label>
              <select value={f.propertyType} onChange={(e) => apply({ propertyType: e.target.value })} className={selectCls}>
                <option value="">Any type</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral">Bedrooms</label>
              <select value={f.bedrooms} onChange={(e) => apply({ bedrooms: e.target.value })} className={selectCls}>
                <option value="">Any beds</option>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+ beds</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral">Guests</label>
              <select value={f.guests} onChange={(e) => apply({ guests: e.target.value })} className={selectCls}>
                <option value="">Any guests</option>
                {[1, 2, 4, 6].map((n) => <option key={n} value={n}>{n}+ guests</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral">Exchange Type</label>
              <select value={f.exchangeType} onChange={(e) => apply({ exchangeType: e.target.value })} className={selectCls}>
                <option value="">Any exchange</option>
                <option value="simultaneous">Simultaneous</option>
                <option value="credits">Credits</option>
              </select>
            </div>
          </div>

          <div className="pt-5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => apply({ savedOnly: !f.savedOnly })}
              className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all ${
                f.savedOnly
                  ? "bg-[var(--crimson)]/10 text-[var(--crimson)] border-[var(--crimson)]/30"
                  : "bg-surface text-neutral-dark border-[var(--border)] hover:border-[var(--navy)] hover:bg-white"
              }`}
            >
              Saved homes only
            </button>
            
            <div className="flex items-center gap-3">
              {hasFilters && (
                <button
                  onClick={() => {
                    setF({ q: "", propertyType: "", bedrooms: "", guests: "", exchangeType: "", savedOnly: false })
                    router.push("/dashboard/browse")
                  }}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-neutral hover:text-[var(--navy)] px-3 py-2"
                >
                  <X size={16} /> Clear all
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="bg-[var(--navy)] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-[var(--navy-light)] transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
