"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { FIELD, LABEL, TEXTAREA } from "@/components/ui/form"

export function ConciergeForm() {
  const router = useRouter()
  const toast = useToast()
  const [destination, setDestination] = useState("")
  const [timeframe, setTimeframe] = useState("")
  const [needs, setNeeds] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ priority: string; category: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destination.trim() || needs.trim().length < 10) {
      toast("Add your destination and a little about what you need.", "error")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, timeframe, needs }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not send your request.", "error")
        setLoading(false)
        return
      }
      setDone({ priority: data.priority, category: data.category })
      router.refresh()
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-[var(--teal-light)] border border-[var(--teal)]/30 rounded-md p-6 text-center">
        <CheckCircle2 size={28} className="mx-auto text-[var(--teal)]" />
        <h3 className="mt-3 font-sans text-xl font-semibold text-[var(--fg)]">Request received</h3>
        <p className="mt-1 text-sm text-neutral-dark">
          Triaged as <span className="font-semibold text-[var(--fg)]">{done.category}</span>,{" "}
          {done.priority} priority. A concierge will be in touch shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="destination" className={LABEL}>Destination</label>
          <input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City or duty station" className={FIELD} />
        </div>
        <div>
          <label htmlFor="timeframe" className={LABEL}>Timeframe <span className="text-neutral normal-case font-normal">(optional)</span></label>
          <input id="timeframe" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} placeholder="e.g. March 2026, or ASAP" className={FIELD} />
        </div>
      </div>
      <div>
        <label htmlFor="needs" className={LABEL}>What do you need help with?</label>
        <textarea id="needs" value={needs} onChange={(e) => setNeeds(e.target.value)} placeholder="Housing near the office, an international school for two children, movers, setting up utilities…" className={TEXTAREA} rows={5} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Sending…" : <>Request concierge help <Send size={16} /></>}
      </button>
    </form>
  )
}
