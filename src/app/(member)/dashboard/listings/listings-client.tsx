"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Home,
  MapPin,
  Pencil,
  Trash2,
  PlayCircle,
  PauseCircle,
  Archive,
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
  primaryPhotoUrl: string | null
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-neutral-light text-neutral-dark",
  ACTIVE: "bg-[var(--teal)]/15 text-[var(--teal)]",
  PAUSED: "bg-[var(--gold)]/15 text-[var(--gold-dark)]",
  ARCHIVED: "bg-neutral-light text-neutral",
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
  const [error, setError] = useState("")

  async function setStatus(id: string, status: string) {
    setBusyId(id)
    setError("")
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || "Could not update the listing.")
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
    setError("")
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || "Could not delete the listing.")
        toast(d.error || "Could not delete the listing.", "error")
      } else {
        toast("Listing deleted", "success")
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  const btn =
    "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"

  return (
    <>
      {error && (
        <div className="bg-[var(--crimson)]/10 border-l-4 border-[var(--crimson)] p-3 rounded-lg mb-4">
          <p className="text-sm text-[var(--crimson)] font-medium">{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((l) => {
          const busy = busyId === l.id
          return (
            <div key={l.id} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col">
              <div className="relative h-40 bg-[var(--background)]">
                {l.primaryPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.primaryPhotoUrl} alt={l.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral/40">
                    <Home size={32} />
                  </div>
                )}
                <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_STYLE[l.status] ?? STATUS_STYLE.DRAFT}`}>
                  {l.status}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-display font-bold text-[var(--navy)] leading-snug">{l.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-neutral mt-1">
                  <MapPin size={13} /> {l.city}, {l.country}
                </div>
                <div className="text-xs text-neutral mt-1">
                  {l.propertyType} · {l.bedrooms} {l.bedrooms === 1 ? "bedroom" : "bedrooms"}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/listings/${l.id}/edit`} className={`${btn} text-[var(--navy)] bg-neutral-light hover:bg-[var(--border)]`}>
                    <Pencil size={13} /> Edit
                  </Link>

                  {(l.status === "DRAFT" || l.status === "PAUSED" || l.status === "ARCHIVED") && (
                    <button
                      disabled={busy || !canPublish}
                      onClick={() => setStatus(l.id, "ACTIVE")}
                      title={canPublish ? "Publish" : "Confirm your email to publish"}
                      className={`${btn} text-white bg-[var(--teal)] hover:opacity-90`}
                    >
                      <PlayCircle size={13} /> Publish
                    </button>
                  )}
                  {l.status === "ACTIVE" && (
                    <button disabled={busy} onClick={() => setStatus(l.id, "PAUSED")} className={`${btn} text-[var(--gold-dark)] bg-[var(--gold)]/15 hover:bg-[var(--gold)]/25`}>
                      <PauseCircle size={13} /> Pause
                    </button>
                  )}
                  {l.status !== "ARCHIVED" && (
                    <button disabled={busy} onClick={() => setStatus(l.id, "ARCHIVED")} className={`${btn} text-neutral-dark bg-neutral-light hover:bg-[var(--border)]`}>
                      <Archive size={13} /> Archive
                    </button>
                  )}
                  <button disabled={busy} onClick={() => remove(l.id)} className={`${btn} text-[var(--crimson)] bg-[var(--crimson)]/10 hover:bg-[var(--crimson)]/20 ml-auto`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
