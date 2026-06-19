"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star, Check } from "lucide-react"

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-neutral-dark">{label}</span>
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label}: ${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="p-0.5"
          >
            <Star
              size={20}
              className={(hover || value) >= n ? "text-[var(--gold)]" : "text-[var(--border)]"}
              fill={(hover || value) >= n ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewAction({
  swapId,
  aboutHost,
  otherName,
}: {
  swapId: string
  aboutHost: boolean
  otherName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [overall, setOverall] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [propertyAccuracy, setPropertyAccuracy] = useState(0)
  const [cleanliness, setCleanliness] = useState(0)
  const [neighbourhoodSafety, setNeighbourhoodSafety] = useState(0)
  const [body, setBody] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!overall) return setError("Please give an overall rating.")
    if (!communication) return setError("Please rate communication.")
    if (aboutHost && (!propertyAccuracy || !cleanliness || !neighbourhoodSafety))
      return setError("Please complete all property ratings.")
    if (body.trim().length < 50) return setError("Please write at least 50 characters.")

    setLoading(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swapId,
          overall,
          communication,
          ...(aboutHost ? { propertyAccuracy, cleanliness, neighbourhoodSafety } : {}),
          body,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not submit your review.")
        setLoading(false)
        return
      }
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-3 py-2 rounded-lg transition-colors"
      >
        <Star size={14} /> Leave a review
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-2 w-full bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-3">
      <h4 className="font-display font-bold text-[var(--navy)]">Review {otherName}</h4>
      {error && <p className="text-xs text-[var(--crimson)] font-medium">{error}</p>}

      <StarRating label="Overall" value={overall} onChange={setOverall} />
      <StarRating label="Communication" value={communication} onChange={setCommunication} />
      {aboutHost && (
        <>
          <StarRating label="Property accuracy" value={propertyAccuracy} onChange={setPropertyAccuracy} />
          <StarRating label="Cleanliness" value={cleanliness} onChange={setCleanliness} />
          <StarRating label="Neighbourhood safety" value={neighbourhoodSafety} onChange={setNeighbourhoodSafety} />
        </>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={`Share how the exchange went (min 50 characters)…`}
        className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-white text-sm text-[var(--navy)] placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"
      />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
          {loading ? "Submitting…" : (<><Check size={14} /> Submit review</>)}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-neutral hover:text-[var(--navy)] px-3 py-2">
          Cancel
        </button>
      </div>
    </form>
  )
}
