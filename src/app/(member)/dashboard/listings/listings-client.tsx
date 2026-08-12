"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Home,
  Trash2,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"

const STATUS_MSG: Record<string, string> = {
  ACTIVE: "Listing published",
  PAUSED: "Listing paused",
  ARCHIVED: "Listing archived",
  DRAFT: "Listing updated",
}

type Listing = {
  id: string
  title: string
  propertyType: string
  city: string
  country: string
  bedrooms: number
  status: string
  photos: { id: string }[]
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-[var(--gold)] text-[var(--fg)]", // Gold/soft gold treatment
  DRAFT: "bg-[var(--navy)]/8 text-[var(--fg)]", // Parchment/neutral
  PAUSED: "bg-[var(--navy)]/10 text-[var(--fg)]/70", // Muted Navy/grey
  ARCHIVED: "bg-[var(--navy)]/10 text-[var(--fg)]/70",
}

export function ListingsClient({
  listings,
  canPublish,
}: {
  listings: Listing[]
  canPublish: boolean
}) {
  const router = useRouter()
  const toast = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  async function setStatus(id: string, status: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast(d.error || "Could not update the listing.", "error")
      } else {
        toast(STATUS_MSG[status] ?? "Listing updated", "success")
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this listing permanently? This cannot be undone.")) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast(d.error || "Could not delete the listing.", "error")
      } else {
        toast("Listing deleted", "success")
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {listings.map((l) => {
        const busy = busyId === l.id
        return (
          <div key={l.id} className="bg-[var(--surface)] rounded-[10px] overflow-hidden border border-[var(--hair)] shadow-sm flex flex-col group">
            {/* Image Header */}
            <div className="relative aspect-[4/3] bg-[var(--navy)]/5 overflow-hidden">
              {l.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/photos/${l.photos[0].id}`} alt={l.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--fg)]/20">
                  <Home size={32} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              <div className="absolute top-4 left-4">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full ${STATUS_STYLE[l.status] ?? STATUS_STYLE.DRAFT}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  {l.status}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-display text-[26px] font-bold text-[var(--fg)] leading-none mb-2">{l.title}</h3>
              <div className="font-sans text-[15px] text-[var(--fg)]/70 mb-5">
                {l.city}, {l.country}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 font-sans text-[13px] text-[var(--fg)] font-medium mb-6">
                <span>{l.bedrooms} {l.bedrooms === 1 ? "bedroom" : "bedrooms"}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--navy)]/20" />
                <span>{l.propertyType}</span>
              </div>

              {/* Actions Footer */}
              <div className="mt-auto pt-5 border-t border-[var(--hair)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/listings/${l.id}/edit`} className="inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--fg)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--navy)]/5 px-5 py-2.5 rounded transition-colors shadow-sm">
                    Edit
                  </Link>
                  <button disabled={busy} onClick={() => remove(l.id)} className="inline-flex items-center justify-center text-[var(--fg)]/40 hover:text-[var(--crimson)] px-3 py-2.5 rounded transition-colors" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {(l.status === "DRAFT" || l.status === "PAUSED" || l.status === "ARCHIVED") && (
                    <button
                      disabled={busy || !canPublish}
                      onClick={() => setStatus(l.id, "ACTIVE")}
                      title={canPublish ? "Publish to network" : "Confirm your email to publish"}
                      className="inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] text-navy bg-[var(--gold)] hover:bg-[var(--gold-dark)] disabled:opacity-50 px-5 py-2.5 rounded transition-colors shadow-sm"
                    >
                      Publish
                    </button>
                  )}
                  {l.status === "ACTIVE" && (
                    <button disabled={busy} onClick={() => setStatus(l.id, "PAUSED")} className="inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--fg)] bg-[var(--navy)]/8 hover:bg-[var(--navy)]/10 px-5 py-2.5 rounded transition-colors shadow-sm">
                      Pause
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
