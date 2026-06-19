"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftRight, AlertTriangle, Calendar } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge, Badge } from "@/components/ui/badges"

type Swap = {
  id: string
  mode: string
  startDate: string
  endDate: string
  guests: number
  status: string
  disputed: boolean
  requester: { fullName: string; avatarInitials: string }
  host: { fullName: string; avatarInitials: string }
  listing: { title: string; city: string; country: string }
}

const FILTERS = ["all", "disputes", "REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

export default function SwapsClient({ initialSwaps }: { initialSwaps: Swap[] }) {
  const router = useRouter()
  const [swaps, setSwaps] = useState(initialSwaps)
  const [filter, setFilter] = useState("all")
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filter === "all") return swaps
    if (filter === "disputes") return swaps.filter((s) => s.disputed)
    return swaps.filter((s) => s.status === filter)
  }, [swaps, filter])

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/swaps/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setSwaps((prev) => prev.map((s) => (s.id === id ? { ...s, ...body } as Swap : s)))
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PageHeader title="Swap Management" subtitle="Monitor exchanges across their lifecycle and mediate disputes." />

      <div className="flex gap-1 bg-surface border border-[var(--border)] rounded-xl p-1 mb-5 w-fit overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
              filter === f ? "bg-[var(--navy)] text-white" : "text-neutral-dark hover:bg-neutral-light"
            }`}
          >
            {f === "all" ? "All" : f === "disputes" ? "Disputes" : f.replace(/_/g, " ").toLowerCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((s) => (
          <div key={s.id} className={`bg-surface rounded-2xl border shadow-sm p-5 ${s.disputed ? "border-[var(--crimson)]" : "border-[var(--border)]"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center -space-x-2">
                  <span className="w-9 h-9 rounded-xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-xs font-bold border-2 border-surface">{s.requester.avatarInitials}</span>
                  <span className="w-9 h-9 rounded-xl bg-[var(--gold)]/20 text-[var(--gold-dark)] flex items-center justify-center text-xs font-bold border-2 border-surface">{s.host.avatarInitials}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--navy)] flex items-center gap-2">
                    {s.requester.fullName} <ArrowLeftRight size={13} className="text-neutral" /> {s.host.fullName}
                  </div>
                  <div className="text-xs text-neutral">{s.listing.title} · {s.listing.city}, {s.listing.country}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={s.mode === "simultaneous" ? "navy" : "gold"}>{s.mode}</Badge>
                <StatusBadge status={s.status} />
                {s.disputed && <Badge tone="crimson"><AlertTriangle size={11} /> Disputed</Badge>}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
              <div className="text-xs text-neutral-dark flex items-center gap-1.5">
                <Calendar size={13} /> {fmt(s.startDate)} → {fmt(s.endDate)} · {s.guests} guest{s.guests > 1 ? "s" : ""}
              </div>
              <div className="flex gap-2">
                {s.disputed && (
                  <button
                    onClick={() => patch(s.id, { disputed: false })}
                    disabled={busyId === s.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--teal)] text-white hover:opacity-90 transition disabled:opacity-50"
                  >
                    Resolve dispute
                  </button>
                )}
                {["REQUESTED", "ACCEPTED", "IN_PROGRESS"].includes(s.status) && (
                  <button
                    onClick={() => patch(s.id, { status: "CANCELLED" })}
                    disabled={busyId === s.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--crimson)] text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-surface rounded-2xl border border-[var(--border)] p-10 text-center text-sm text-neutral">No swaps in this view.</div>
        )}
      </div>
    </div>
  )
}
