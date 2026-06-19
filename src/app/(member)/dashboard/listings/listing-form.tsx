"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UploadCloud, X } from "lucide-react"

const PROPERTY_TYPES = ["Apartment", "House", "Villa", "Studio", "Townhouse"]
const EXCHANGE_TYPES = [
  { value: "either", label: "Either" },
  { value: "simultaneous", label: "Simultaneous only" },
  { value: "credits", label: "Credits only" },
]
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = "image/png,image/jpeg,image/webp"

export type ListingValues = {
  id?: string
  title: string
  propertyType: string
  city: string
  country: string
  neighbourhood: string
  bedrooms: number
  bathrooms: number
  maxGuests: number
  description: string
  exchangeType: string
  primaryPhotoUrl: string | null
}

const EMPTY: ListingValues = {
  title: "",
  propertyType: "Apartment",
  city: "",
  country: "",
  neighbourhood: "",
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  description: "",
  exchangeType: "either",
  primaryPhotoUrl: null,
}

const inputCls =
  "block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"

export function ListingForm({
  mode,
  initial,
}: {
  mode: "create" | "edit"
  initial?: ListingValues
}) {
  const router = useRouter()
  const [v, setV] = useState<ListingValues>(initial ?? EMPTY)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof ListingValues>(key: K, value: ListingValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }))

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!ACCEPT.split(",").includes(file.type)) return setError("Photo must be a PNG, JPG, or WebP image.")
    if (file.size > MAX_BYTES) return setError("That image is over 5 MB. Please use a smaller file.")
    const reader = new FileReader()
    reader.onload = () => set("primaryPhotoUrl", reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const url = mode === "create" ? "/api/listings" : `/api/listings/${initial?.id}`
      const method = mode === "create" ? "POST" : "PATCH"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not save the listing.")
        setLoading(false)
        return
      }
      router.push("/dashboard/listings")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-8 space-y-5">
      {error && (
        <div className="bg-[var(--crimson)]/10 border-l-4 border-[var(--crimson)] p-3 rounded-lg">
          <p className="text-sm text-[var(--crimson)] font-medium">{error}</p>
        </div>
      )}

      {/* Photo */}
      <div>
        <label className={labelCls}>Primary photo</label>
        {v.primaryPhotoUrl ? (
          <div className="relative rounded-xl border border-[var(--border)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.primaryPhotoUrl} alt="Listing" className="w-full h-52 object-cover" />
            <button
              type="button"
              onClick={() => set("primaryPhotoUrl", null)}
              aria-label="Remove photo"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-[var(--navy)] flex items-center justify-center shadow hover:bg-white"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] cursor-pointer hover:border-[var(--gold)] transition-colors">
            <UploadCloud size={24} className="text-neutral mb-2" />
            <span className="text-sm font-semibold text-[var(--navy)]">Upload a photo</span>
            <span className="text-xs text-neutral mt-1">PNG, JPG or WebP · max 5 MB</span>
            <input type="file" accept={ACCEPT} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
        )}
      </div>

      <div>
        <label htmlFor="title" className={labelCls}>Title</label>
        <input id="title" className={inputCls} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Sunlit apartment near the lake" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="propertyType" className={labelCls}>Property type</label>
          <select id="propertyType" className={inputCls} value={v.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="exchangeType" className={labelCls}>Exchange preference</label>
          <select id="exchangeType" className={inputCls} value={v.exchangeType} onChange={(e) => set("exchangeType", e.target.value)}>
            {EXCHANGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className={labelCls}>City</label>
          <input id="city" className={inputCls} value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="Geneva" required />
        </div>
        <div>
          <label htmlFor="country" className={labelCls}>Country</label>
          <input id="country" className={inputCls} value={v.country} onChange={(e) => set("country", e.target.value)} placeholder="Switzerland" required />
        </div>
      </div>

      <div>
        <label htmlFor="neighbourhood" className={labelCls}>Neighbourhood <span className="text-neutral normal-case font-normal">(optional)</span></label>
        <input id="neighbourhood" className={inputCls} value={v.neighbourhood} onChange={(e) => set("neighbourhood", e.target.value)} placeholder="Eaux-Vives" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="bedrooms" className={labelCls}>Bedrooms</label>
          <input id="bedrooms" type="number" min={0} max={50} className={inputCls} value={v.bedrooms} onChange={(e) => set("bedrooms", Number(e.target.value))} />
        </div>
        <div>
          <label htmlFor="bathrooms" className={labelCls}>Bathrooms</label>
          <input id="bathrooms" type="number" min={0} max={50} className={inputCls} value={v.bathrooms} onChange={(e) => set("bathrooms", Number(e.target.value))} />
        </div>
        <div>
          <label htmlFor="maxGuests" className={labelCls}>Max guests</label>
          <input id="maxGuests" type="number" min={1} max={50} className={inputCls} value={v.maxGuests} onChange={(e) => set("maxGuests", Number(e.target.value))} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>Description</label>
        <textarea id="description" rows={4} className={inputCls} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe your home, the neighbourhood, and what makes it a great exchange." />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 sm:flex-none flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? "Saving…" : mode === "create" ? "Save listing" : "Save changes"}
        </button>
        <Link href="/dashboard/listings" className="py-3 px-6 rounded-xl text-sm font-semibold text-[var(--navy)] border border-[var(--border)] hover:border-[var(--navy)] transition-colors">
          Cancel
        </Link>
      </div>
      <p className="text-xs text-neutral">New listings are saved as a draft. Publish them from your listings once you&apos;re fully verified.</p>
    </form>
  )
}
