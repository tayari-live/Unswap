"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarCheck, CheckCircle2 } from "lucide-react"

const MODE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  either: [
    { value: "simultaneous", label: "Simultaneous (we swap at the same time)" },
    { value: "credits", label: "Credits (I stay now, host earns credits)" },
  ],
  simultaneous: [{ value: "simultaneous", label: "Simultaneous (we swap at the same time)" }],
  credits: [{ value: "credits", label: "Credits (I stay now, host earns credits)" }],
}

const inputCls =
  "block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white text-sm text-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"

export function SwapRequestForm({
  listingId,
  exchangeType,
  maxGuests,
}: {
  listingId: string
  exchangeType: string
  maxGuests: number
}) {
  const router = useRouter()
  const modes = MODE_OPTIONS[exchangeType] ?? MODE_OPTIONS.either
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [guests, setGuests] = useState(1)
  const [mode, setMode] = useState(modes[0].value)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, mode, startDate, endDate, guests, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not send your request.")
        setLoading(false)
        return
      }
      setDone(true)
    } catch {
      setError("Something went wrong. Please try again.")
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

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-[var(--border)] rounded-2xl p-5 space-y-4 shadow-sm">
      <h3 className="font-display text-lg font-bold text-[var(--navy)]">Request a swap</h3>
      {error && (
        <div className="bg-[var(--crimson)]/10 border-l-4 border-[var(--crimson)] p-3 rounded-lg">
          <p className="text-sm text-[var(--crimson)] font-medium">{error}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="start" className={labelCls}>From</label>
          <input id="start" type="date" min={today} required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="end" className={labelCls}>To</label>
          <input id="end" type="date" min={startDate || today} required value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
        </div>
      </div>
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
        <button type="submit" disabled={loading} className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 transition-colors">
          {loading ? "Sending…" : "Send request"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="py-3 px-4 rounded-xl text-sm font-semibold text-[var(--navy)] border border-[var(--border)] hover:border-[var(--navy)] transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
