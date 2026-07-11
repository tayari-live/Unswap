"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarCheck, CheckCircle2, CalendarX2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"

const MODE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  either: [
    { value: "simultaneous", label: "Simultaneous (we swap at the same time)" },
    { value: "credits", label: "Credits (I stay now, host earns credits)" },
  ],
  simultaneous: [{ value: "simultaneous", label: "Simultaneous (we swap at the same time)" }],
  credits: [{ value: "credits", label: "Credits (I stay now, host earns credits)" }],
}

// Must mirror the server's duration bands in services/swaps.ts (nights, inclusive).
const DURATION_BANDS: Record<string, { label: string; min: number; max: number }> = {
  short_term: { label: "Short-term", min: 7, max: 14 },
  medium_term: { label: "Medium-term", min: 15, max: 90 },
  long_term: { label: "Long-term", min: 91, max: 180 },
  extended: { label: "Extended", min: 181, max: 548 },
}

type Blackout = { start: string; end: string }

const inputCls =
  "block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white text-sm text-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"

/** Whole nights between two YYYY-MM-DD dates (end exclusive of start). */
function nightsBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000)
}

/** Add `days` to a YYYY-MM-DD date, returning YYYY-MM-DD. */
function addDays(date: string, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function fmtRange(b: Blackout) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
  return `${new Date(b.start).toLocaleDateString(undefined, opts)} – ${new Date(b.end).toLocaleDateString(undefined, opts)}`
}

export function SwapRequestForm({
  listingId,
  exchangeType,
  maxGuests,
  swapDurations = [],
  blackouts = [],
}: {
  listingId: string
  exchangeType: string
  maxGuests: number
  swapDurations?: string[]
  blackouts?: Blackout[]
}) {
  const router = useRouter()
  const toast = useToast()
  const modes = MODE_OPTIONS[exchangeType] ?? MODE_OPTIONS.either
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [guests, setGuests] = useState(1)
  const [mode, setMode] = useState(modes[0].value)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const offeredBands = swapDurations.map((d) => DURATION_BANDS[d]).filter(Boolean)

  // Live, client-side mirror of the server's acceptance rules. Returns the first
  // blocking reason (or null when the request is valid and ready to send).
  const validation = useMemo<string | null>(() => {
    if (!startDate || !endDate) return "Choose your arrival and departure dates."
    if (startDate < today) return "Arrival can't be in the past."
    if (endDate <= startDate) return "Departure must be after arrival."
    if (guests < 1 || guests > maxGuests)
      return `This home hosts up to ${maxGuests} guest${maxGuests === 1 ? "" : "s"}.`

    const clash = blackouts.some((b) => startDate <= b.end && endDate >= b.start)
    if (clash) return "Those dates fall within the host's blackout period."

    if (offeredBands.length) {
      const nights = nightsBetween(startDate, endDate)
      const fits = offeredBands.some((band) => nights >= band.min && nights <= band.max)
      if (!fits) return "Your stay length doesn't match this home's offered swap durations."
    }
    return null
  }, [startDate, endDate, guests, maxGuests, blackouts, offeredBands, today])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validation) {
      toast(validation, "error")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, mode, startDate, endDate, guests, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not send your request.", "error")
        setLoading(false)
        return
      }
      setDone(true)
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-[var(--teal-light)] border border-[var(--teal)]/30 rounded-2xl p-6 text-center">
        <CheckCircle2 size={28} className="mx-auto text-[var(--teal)]" />
        <h3 className="mt-3 font-display text-lg font-bold text-[var(--navy)]">Request sent</h3>
        <p className="mt-1 text-sm text-neutral-dark">The host has been notified and will respond shortly.</p>
        <button
          onClick={() => router.push("/dashboard/swaps")}
          className="mt-4 inline-flex items-center justify-center py-2.5 px-5 rounded-xl text-sm font-semibold text-white bg-[var(--navy)] hover:bg-[var(--navy-light)] transition-colors"
        >
          View my requests
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors shadow-sm"
      >
        <CalendarCheck size={18} /> Request a swap
      </button>
    )
  }

  // Quick Swap: once an arrival is chosen, offer one-tap end dates that land
  // exactly on the shortest valid stay for each duration band the host offers.
  const quickFills = startDate
    ? offeredBands.map((band) => ({ label: band.label, nights: band.min, end: addDays(startDate, band.min) }))
    : []

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-[var(--border)] rounded-2xl p-5 space-y-4 shadow-sm">
      <h3 className="font-display text-lg font-bold text-[var(--navy)]">Request a swap</h3>

      {blackouts.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-[var(--parchment)] border border-[var(--gold)]/20 p-3">
          <CalendarX2 size={15} className="mt-0.5 shrink-0 text-[var(--gold-dark)]" />
          <div className="text-xs text-neutral-dark">
            <span className="font-semibold text-[var(--navy)]">Host unavailable:</span>{" "}
            {blackouts.map((b) => fmtRange(b)).join(" · ")}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="start" className={labelCls}>From</label>
          <input id="start" type="date" min={today} required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="end" className={labelCls}>To</label>
          <input id="end" type="date" min={startDate ? addDays(startDate, 1) : today} required value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
        </div>
      </div>

      {quickFills.length > 0 && (
        <div>
          <span className="text-xs text-neutral">Quick swap from {new Date(startDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}:</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {quickFills.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => setEndDate(q.end)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  endDate === q.end
                    ? "bg-[var(--navy)] text-white border-[var(--navy)]"
                    : "bg-white text-[var(--navy)] border-[var(--border)] hover:border-[var(--navy)]"
                }`}
              >
                {q.label} · {q.nights} nights
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="guests" className={labelCls}>Guests</label>
          <input id="guests" type="number" min={1} max={maxGuests} required value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label htmlFor="mode" className={labelCls}>Mode</label>
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls} disabled={modes.length === 1}>
            {modes.map((m) => <option key={m.value} value={m.value}>{m.value === "simultaneous" ? "Simultaneous" : "Credits"}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelCls}>Message <span className="text-neutral normal-case font-normal">(optional)</span></label>
        <textarea id="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Introduce yourself and your plans." className={inputCls} />
      </div>

      <div className="flex gap-3">
        {/* Always clickable — a blocked submit explains itself via toast. */}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Sending…" : "Send request"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="py-3 px-4 rounded-xl text-sm font-semibold text-[var(--navy)] border border-[var(--border)] hover:border-[var(--navy)] transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
