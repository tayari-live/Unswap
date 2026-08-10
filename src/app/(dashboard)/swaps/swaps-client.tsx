"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftRight, AlertTriangle, Calendar } from "lucide-react"
import { LuxPageHeader } from "@/components/ui/lux"
import { StatusBadge, Badge } from "@/components/ui/badges"
import { AvatarInitials } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterTabs } from "@/components/ui/filter-tabs"

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

const FILTERS = [
  { key: "all", label: "All" },
  { key: "disputes", label: "Disputes" },
  { key: "REQUESTED", label: "Requested" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
]

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
      <LuxPageHeader eyebrow="Exchanges" title="Swap Management" subtitle="Monitor exchanges across their lifecycle and mediate disputes." />

      <FilterTabs options={FILTERS} value={filter} onChange={setFilter} className="mb-5 w-fit" />

      <div className="space-y-3">
        {filtered.map((s) => (
          <div key={s.id} className={`bg-surface rounded-md border p-5 ${s.disputed ? "border-[var(--crimson)]" : "border-[var(--navy)]/10"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center -space-x-2">
                  <AvatarInitials initials={s.requester.avatarInitials} tone="navy" className="border-2 border-surface" />
                  <AvatarInitials initials={s.host.avatarInitials} tone="gold" className="border-2 border-surface" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--fg)] flex items-center gap-2">
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

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--hair)]">
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
        {filtered.length === 0 && <EmptyState padding="sm" description="No swaps in this view." />}
      </div>
    </div>
  )
}
