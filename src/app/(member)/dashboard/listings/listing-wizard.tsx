"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  UploadCloud, X, ArrowUp, ArrowDown, Plus, Minus, Check, ChevronRight, ChevronLeft,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"

const PROPERTY_TYPES = ["Apartment", "House", "Villa", "Studio", "Townhouse"]
const AMENITIES = [
  { v: "wifi", l: "Wi-Fi" }, { v: "home_office", l: "Home office / desk" }, { v: "parking", l: "Parking" },
  { v: "garden", l: "Garden" }, { v: "pool", l: "Pool" }, { v: "dishwasher", l: "Dishwasher" },
  { v: "washing_machine", l: "Washing machine" }, { v: "air_conditioning", l: "Air conditioning" },
  { v: "lift", l: "Lift access" }, { v: "pet_friendly", l: "Pet-friendly" }, { v: "accessible", l: "Accessible" },
]
const DURATIONS = [
  { v: "short_term", l: "Short-term", d: "7–14 days · vacation, annual leave" },
  { v: "medium_term", l: "Medium-term", d: "15–90 days · temporary assignment, TDY" },
  { v: "long_term", l: "Long-term", d: "91–180 days · rotation, initial arrival" },
  { v: "extended", l: "Extended rotation", d: "181–548 days · full duty-station rotation" },
]
const ACCEPT = ["image/png", "image/jpeg", "image/webp"]
const MAX_BYTES = 10 * 1024 * 1024
// Photos are stored inline as data URLs and sent in one request body, which the
// platform caps at ~4.5 MB. Downscale to a sane long edge + re-encode as JPEG so
// each photo is small, and keep the combined payload under a safe budget.
const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82
const TOTAL_BUDGET = 3_800_000 // combined data-URL chars across all photos

export type WizardValues = {
  id?: string
  title: string; propertyType: string; fullAddress: string; city: string; neighbourhood: string; country: string
  bedrooms: number; bathrooms: number; maxGuests: number; description: string; amenities: string[]
  photos: { url: string; caption?: string }[]
  swapDurations: string[]; exchangeType: string; blackouts: { startDate: string; endDate: string }[]
  houseRules: string; emergencyName: string; emergencyPhone: string; emergencyRelationship: string
}

const EMPTY: WizardValues = {
  title: "", propertyType: "Apartment", fullAddress: "", city: "", neighbourhood: "", country: "",
  bedrooms: 1, bathrooms: 1, maxGuests: 2, description: "", amenities: [],
  photos: [], swapDurations: [], exchangeType: "either", blackouts: [],
  houseRules: "", emergencyName: "", emergencyPhone: "", emergencyRelationship: "",
}

const input = "block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)]"
const label = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"
const STEPS = ["Basics", "Details", "Photos", "Exchange", "Rules", "Review"]

function readImage(file: File): Promise<{ url?: string; error?: string }> {
  return new Promise((resolve) => {
    if (!ACCEPT.includes(file.type)) return resolve({ error: "Use JPG, PNG, or WebP." })
    if (file.size > MAX_BYTES) return resolve({ error: "Image exceeds the 10 MB limit." })
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        if (Math.min(img.naturalWidth, img.naturalHeight) < 1080)
          return resolve({ error: "This photo is too small — please upload a higher resolution image." })
        // Downscale to MAX_EDGE and re-encode as JPEG to shrink the upload payload.
        const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.round(img.naturalWidth * scale)
        const h = Math.round(img.naturalHeight * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve({ url: reader.result as string })
        ctx.drawImage(img, 0, 0, w, h)
        resolve({ url: canvas.toDataURL("image/jpeg", JPEG_QUALITY) })
      }
      img.onerror = () => resolve({ error: "Could not read that image." })
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function Stepper({ value, set, min, max }: { value: number; set: (n: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => set(Math.max(min, value - 1))} className="w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center hover:border-[var(--navy)]"><Minus size={15} /></button>
      <span className="w-8 text-center font-semibold text-[var(--navy)]">{value}{value >= max ? "+" : ""}</span>
      <button type="button" onClick={() => set(Math.min(max, value + 1))} className="w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center hover:border-[var(--navy)]"><Plus size={15} /></button>
    </div>
  )
}

export function ListingWizard({ mode, initial }: { mode: "create" | "edit"; initial?: WizardValues }) {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [v, setV] = useState<WizardValues>(initial ?? EMPTY)
  const [loading, setLoading] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)

  const set = <K extends keyof WizardValues>(k: K, val: WizardValues[K]) => setV((p) => ({ ...p, [k]: val }))
  const toggle = (k: "amenities" | "swapDurations", val: string) =>
    setV((p) => ({ ...p, [k]: p[k].includes(val) ? p[k].filter((x) => x !== val) : [...p[k], val] }))

  async function addPhotos(files: FileList | null) {
    if (!files) return
    setPhotoBusy(true)
    const next = [...v.photos]
    let total = next.reduce((sum, p) => sum + p.url.length, 0)
    for (const f of Array.from(files)) {
      if (next.length >= 20) { toast("Maximum 20 photos.", "error"); break }
      const r = await readImage(f)
      if (r.error) { toast(r.error, "error"); continue }
      if (total + r.url!.length > TOTAL_BUDGET) {
        toast("These photos exceed the total upload size. Remove some or use fewer images.", "error")
        break
      }
      total += r.url!.length
      next.push({ url: r.url!, caption: "" })
    }
    set("photos", next)
    setPhotoBusy(false)
  }
  const movePhoto = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= v.photos.length) return
    const next = [...v.photos]
    ;[next[i], next[j]] = [next[j], next[i]]
    set("photos", next)
  }

  // Per-step gate before advancing.
  function stepValid(s: number): string | null {
    if (s === 0) {
      if (!v.title.trim()) return "Add a property title."
      if (v.title.length > 80) return "Title must be 80 characters or fewer."
      if (!v.city.trim()) return "City is required."
      if (!v.country.trim()) return "Country is required."
    }
    if (s === 1) {
      if (v.description.trim().length < 100) return "Description must be at least 100 characters."
    }
    if (s === 2 && v.photos.length < 5) return "Upload at least 5 photos."
    if (s === 3 && v.swapDurations.length === 0) return "Select at least one swap duration type."
    if (s === 4 && (!v.emergencyName.trim() || !v.emergencyPhone.trim())) return "Emergency contact name and phone are required."
    return null
  }

  function next() {
    const err = stepValid(step)
    if (err) { toast(err, "error"); return }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  async function submit() {
    for (let s = 0; s < 5; s++) {
      const err = stepValid(s)
      if (err) { toast(err, "error"); setStep(s); return }
    }
    setLoading(true)
    try {
      const res = await fetch(mode === "create" ? "/api/listings" : `/api/listings/${initial?.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error || "Could not save the listing.", "error"); setLoading(false); return }
      toast(mode === "create" ? "Listing saved as draft" : "Listing updated", "success")
      router.push("/dashboard/listings")
      router.refresh()
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-8">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-[var(--gold)]" : "bg-[var(--border)]"}`} />
            <div className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wide ${i === step ? "text-[var(--navy)]" : "text-neutral"}`}>{s}</div>
          </div>
        ))}
      </div>


      {/* Step 0 — Basics */}
      {step === 0 && (
        <div className="space-y-5">
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">Property basics</h2>
          <div><label className={label}>Property title <span className="text-neutral normal-case font-normal">({v.title.length}/80)</span></label>
            <input className={input} maxLength={80} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Sunlit apartment near the lake" /></div>
          <div><label className={label}>Property type</label>
            <select className={input} value={v.propertyType} onChange={(e) => set("propertyType", e.target.value)}>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className={label}>Full address <span className="text-neutral normal-case font-normal">(private — never shown publicly)</span></label>
            <input className={input} value={v.fullAddress} onChange={(e) => set("fullAddress", e.target.value)} placeholder="12 Rue du Lac, Apt 4B" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={label}>City</label><input className={input} value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="Geneva" /></div>
            <div><label className={label}>Country</label><input className={input} value={v.country} onChange={(e) => set("country", e.target.value)} placeholder="Switzerland" /></div>
          </div>
          <div><label className={label}>Neighbourhood <span className="text-neutral normal-case font-normal">(shown publicly)</span></label>
            <input className={input} value={v.neighbourhood} onChange={(e) => set("neighbourhood", e.target.value)} placeholder="Eaux-Vives" /></div>
        </div>
      )}

      {/* Step 1 — Details */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">Property details</h2>
          <div className="flex flex-wrap gap-8">
            <div><label className={label}>Bedrooms</label><Stepper value={v.bedrooms} set={(n) => set("bedrooms", n)} min={1} max={10} /></div>
            <div><label className={label}>Bathrooms</label><Stepper value={v.bathrooms} set={(n) => set("bathrooms", n)} min={1} max={6} /></div>
            <div><label className={label}>Max guests</label><Stepper value={v.maxGuests} set={(n) => set("maxGuests", n)} min={1} max={12} /></div>
          </div>
          <div><label className={label}>Description <span className="text-neutral normal-case font-normal">({v.description.trim().length}/100 min)</span></label>
            <textarea rows={5} className={input} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe your home, the neighbourhood, and what makes it a great exchange." /></div>
          <div><label className={label}>Amenities</label>
            <div className="grid grid-cols-2 gap-2">{AMENITIES.map((a) => (
              <label key={a.v} className="flex items-center gap-2 text-sm text-neutral-dark cursor-pointer">
                <input type="checkbox" checked={v.amenities.includes(a.v)} onChange={() => toggle("amenities", a.v)} className="accent-[var(--navy)]" /> {a.l}
              </label>))}</div></div>
        </div>
      )}

      {/* Step 2 — Photos */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">Photos <span className="text-sm font-normal text-neutral">({v.photos.length}/20 · min 5)</span></h2>
          <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] cursor-pointer hover:border-[var(--gold)] transition-colors text-center">
            <UploadCloud size={26} className="text-neutral mb-2" />
            <span className="text-sm font-semibold text-[var(--navy)]">{photoBusy ? "Processing…" : "Click or drop images to upload"}</span>
            <span className="text-xs text-neutral mt-1">JPG, PNG, WebP · max 10 MB · min 1080px shortest edge</span>
            <input type="file" accept={ACCEPT.join(",")} multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
          </label>
          <div className="space-y-2">
            {v.photos.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-[var(--background)] border border-[var(--border)] rounded-xl p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1">
                  {i === 0 && <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--gold-dark)]">Primary</span>}
                  <input className="block w-full mt-0.5 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-white text-xs text-[var(--navy)]" maxLength={60} placeholder="Caption (optional)" value={p.caption ?? ""} onChange={(e) => { const n = [...v.photos]; n[i] = { ...n[i], caption: e.target.value }; set("photos", n) }} />
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} className="text-neutral hover:text-[var(--navy)] disabled:opacity-30"><ArrowUp size={15} /></button>
                  <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === v.photos.length - 1} className="text-neutral hover:text-[var(--navy)] disabled:opacity-30"><ArrowDown size={15} /></button>
                </div>
                <button type="button" onClick={() => set("photos", v.photos.filter((_, x) => x !== i))} className="text-neutral hover:text-[var(--crimson)]"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Exchange */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">Exchange preferences</h2>
          <div>
            <label className={label}>Swap duration types <span className="text-neutral normal-case font-normal">(select at least one)</span></label>
            <div className="space-y-2">{DURATIONS.map((d) => (
              <label key={d.v} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${v.swapDurations.includes(d.v) ? "border-[var(--gold)] bg-[var(--parchment)]" : "border-[var(--border)]"}`}>
                <input type="checkbox" checked={v.swapDurations.includes(d.v)} onChange={() => toggle("swapDurations", d.v)} className="mt-0.5 accent-[var(--navy)]" />
                <span><span className="text-sm font-semibold text-[var(--navy)]">{d.l}</span><br /><span className="text-xs text-neutral">{d.d}</span></span>
              </label>))}</div>
          </div>
          <div>
            <label className={label}>Preferred exchange type</label>
            {[["either", "Either (appears in all searches)"], ["simultaneous", "Simultaneous only"], ["credits", "Non-simultaneous (Credits) only"]].map(([val, lab]) => (
              <label key={val} className="flex items-center gap-2 text-sm text-neutral-dark py-1 cursor-pointer">
                <input type="radio" name="exchangeType" checked={v.exchangeType === val} onChange={() => set("exchangeType", val)} className="accent-[var(--navy)]" /> {lab}
              </label>))}
          </div>
          <div>
            <label className={label}>Blackout dates <span className="text-neutral normal-case font-normal">(optional — unavailable ranges)</span></label>
            {v.blackouts.map((b, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="date" className={input} value={b.startDate} onChange={(e) => { const n = [...v.blackouts]; n[i] = { ...n[i], startDate: e.target.value }; set("blackouts", n) }} />
                <span className="text-neutral text-sm">to</span>
                <input type="date" className={input} value={b.endDate} onChange={(e) => { const n = [...v.blackouts]; n[i] = { ...n[i], endDate: e.target.value }; set("blackouts", n) }} />
                <button type="button" onClick={() => set("blackouts", v.blackouts.filter((_, x) => x !== i))} className="text-neutral hover:text-[var(--crimson)]"><X size={16} /></button>
              </div>
            ))}
            <button type="button" onClick={() => set("blackouts", [...v.blackouts, { startDate: "", endDate: "" }])} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)]"><Plus size={15} /> Add blackout range</button>
          </div>
        </div>
      )}

      {/* Step 4 — Rules + emergency */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">House rules & emergency contact</h2>
          <div><label className={label}>House rules <span className="text-neutral normal-case font-normal">(shown before a request)</span></label>
            <textarea rows={4} maxLength={1000} className={input} value={v.houseRules} onChange={(e) => set("houseRules", e.target.value)} placeholder="No smoking, no shoes indoors, please water the plants." /></div>
          <div className="rounded-xl bg-[var(--parchment)] border border-[var(--gold)]/20 p-4 space-y-4">
            <p className="text-xs text-neutral-dark">Emergency contact is encrypted and only shared with a confirmed swap partner.</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={label}>Contact name</label><input className={input} value={v.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} /></div>
              <div><label className={label}>Phone</label><input className={input} value={v.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} placeholder="+41 …" /></div>
            </div>
            <div><label className={label}>Relationship to property</label><input className={input} value={v.emergencyRelationship} onChange={(e) => set("emergencyRelationship", e.target.value)} placeholder="Building manager, neighbour…" /></div>
          </div>
        </div>
      )}

      {/* Step 5 — Review */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">Review & submit</h2>
          <p className="text-sm text-neutral">Your listing will be saved as a <strong>draft</strong>. Publish it from My Listings when you&apos;re ready.</p>
          <dl className="text-sm divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
            {[
              ["Title", v.title], ["Type", v.propertyType], ["Location", `${v.neighbourhood ? v.neighbourhood + ", " : ""}${v.city}, ${v.country}`],
              ["Capacity", `${v.bedrooms} bed · ${v.bathrooms} bath · ${v.maxGuests} guests`],
              ["Amenities", v.amenities.length ? `${v.amenities.length} selected` : "—"],
              ["Photos", `${v.photos.length}`], ["Durations", v.swapDurations.length ? v.swapDurations.join(", ") : "—"],
              ["Exchange", v.exchangeType], ["Emergency contact", v.emergencyName || "—"],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-neutral">{k}</dt><dd className="font-medium text-[var(--navy)] text-right truncate">{val}</dd></div>
            ))}
          </dl>
        </div>
      )}

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--navy)] px-4 py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--navy)]"><ChevronLeft size={16} /> Back</button>
        ) : (
          <Link href="/dashboard/listings" className="text-sm font-semibold text-neutral hover:text-[var(--navy)] px-2">Cancel</Link>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-6 py-2.5 rounded-xl shadow-sm">Continue <ChevronRight size={16} /></button>
        ) : (
          <button type="button" onClick={submit} disabled={loading} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-6 py-2.5 rounded-xl shadow-sm disabled:opacity-50">{loading ? "Saving…" : (<><Check size={16} /> Save listing</>)}</button>
        )}
      </div>
    </div>
  )
}
