"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  UploadCloud, X, Plus, Minus, Check, ChevronRight, ChevronLeft, Star, Sparkles,
  Building2, Home, Castle, DoorOpen, Building,
  Wifi, Laptop, Car, Flower2, Waves, Utensils, WashingMachine, AirVent, ArrowUpDown, PawPrint, Accessibility,
  CalendarDays, CalendarRange, CalendarClock, Calendar, Shuffle, Repeat, Coins,
  type LucideIcon,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"

const PROPERTY_TYPES: { v: string; icon: LucideIcon }[] = [
  { v: "Apartment", icon: Building2 },
  { v: "House", icon: Home },
  { v: "Villa", icon: Castle },
  { v: "Studio", icon: DoorOpen },
  { v: "Townhouse", icon: Building },
]
const AMENITIES: { v: string; l: string; icon: LucideIcon }[] = [
  { v: "wifi", l: "Wi-Fi", icon: Wifi },
  { v: "home_office", l: "Home office", icon: Laptop },
  { v: "parking", l: "Parking", icon: Car },
  { v: "garden", l: "Garden", icon: Flower2 },
  { v: "pool", l: "Pool", icon: Waves },
  { v: "dishwasher", l: "Dishwasher", icon: Utensils },
  { v: "washing_machine", l: "Washing machine", icon: WashingMachine },
  { v: "air_conditioning", l: "Air conditioning", icon: AirVent },
  { v: "lift", l: "Lift access", icon: ArrowUpDown },
  { v: "pet_friendly", l: "Pet-friendly", icon: PawPrint },
  { v: "accessible", l: "Accessible", icon: Accessibility },
]
const DURATIONS: { v: string; l: string; d: string; icon: LucideIcon }[] = [
  { v: "short_term", l: "Short-term", d: "7–14 days · vacation, annual leave", icon: CalendarDays },
  { v: "medium_term", l: "Medium-term", d: "15–90 days · temporary assignment, TDY", icon: CalendarRange },
  { v: "long_term", l: "Long-term", d: "91–180 days · rotation, initial arrival", icon: CalendarClock },
  { v: "extended", l: "Extended rotation", d: "181–548 days · full duty-station rotation", icon: Calendar },
]
const EXCHANGE_TYPES: { v: string; l: string; d: string; icon: LucideIcon }[] = [
  { v: "either", l: "Either", d: "Appears in all searches — simultaneous or credits", icon: Shuffle },
  { v: "simultaneous", l: "Simultaneous", d: "We swap homes at the same time", icon: Repeat },
  { v: "credits", l: "Credits", d: "Host now, earn credits to stay later", icon: Coins },
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

// Nothing selectable is pre-selected — members must actively choose their
// property type and exchange mode before they can continue.
const EMPTY: WizardValues = {
  title: "", propertyType: "", fullAddress: "", city: "", neighbourhood: "", country: "",
  bedrooms: 1, bathrooms: 1, maxGuests: 2, description: "", amenities: [],
  photos: [], swapDurations: [], exchangeType: "", blackouts: [],
  houseRules: "", emergencyName: "", emergencyPhone: "", emergencyRelationship: "",
}

const input = "block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)]"
const label = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"

// One question per screen, HomeExchange-style. Screens are grouped into
// sections for the segmented progress bar; `optional` screens get a Skip.
const SECTIONS = ["Your home", "Amenities", "Photos", "Exchange", "Final details"]
const SCREENS: { section: number; optional?: boolean }[] = [
  { section: 0 },                  // 0 title + type
  { section: 0 },                  // 1 location
  { section: 0 },                  // 2 space
  { section: 0 },                  // 3 description
  { section: 1, optional: true },  // 4 amenities
  { section: 2 },                  // 5 photos
  { section: 3 },                  // 6 durations
  { section: 3 },                  // 7 exchange type
  { section: 3, optional: true },  // 8 blackouts
  { section: 4, optional: true },  // 9 house rules
  { section: 4 },                  // 10 emergency contact
  { section: 4 },                  // 11 review
]

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

/** Selectable icon tile — the HomeExchange-style card checkbox/radio. */
function IconCard({
  icon: Icon, title, desc, selected, onClick,
}: {
  icon: LucideIcon; title: string; desc?: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-colors ${
        selected ? "border-[var(--gold)] bg-[var(--parchment)]" : "border-[var(--border)] bg-white hover:border-[var(--navy)]"
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--gold-dark)] text-white flex items-center justify-center">
          <Check size={12} />
        </span>
      )}
      <Icon size={22} strokeWidth={1.5} className={selected ? "text-[var(--gold-dark)]" : "text-[var(--navy)]"} />
      <span className="text-sm font-semibold text-[var(--navy)] leading-tight">{title}</span>
      {desc && <span className="text-xs text-neutral leading-snug">{desc}</span>}
    </button>
  )
}

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--navy)] leading-tight">{title}</h2>
      {sub && <p className="mt-2 text-sm text-neutral leading-relaxed">{sub}</p>}
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
  const [aiBusy, setAiBusy] = useState(false)

  // Draft the description with AI from the facts gathered so far.
  async function writeWithAi() {
    setAiBusy(true)
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: v.title,
          propertyType: v.propertyType,
          city: v.city,
          country: v.country,
          neighbourhood: v.neighbourhood,
          bedrooms: v.bedrooms,
          bathrooms: v.bathrooms,
          maxGuests: v.maxGuests,
          amenities: v.amenities,
          notes: v.description,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not draft a description.", "error")
        return
      }
      setV((p) => ({ ...p, description: data.description }))
    } catch {
      toast("Could not draft a description. Please try again.", "error")
    } finally {
      setAiBusy(false)
    }
  }

  const set = <K extends keyof WizardValues>(k: K, val: WizardValues[K]) =>
    setV((p) => ({ ...p, [k]: val }))
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
  // Drag-and-drop reorder (with "Make cover" as the click fallback).
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const reorder = (from: number, to: number) => {
    if (from === to) return
    setV((p) => {
      const next = [...p.photos]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { ...p, photos: next }
    })
  }

  // Per-screen gate before advancing.
  function screenValid(s: number): string | null {
    if (s === 0) {
      if (!v.title.trim()) return "Add a property title."
      if (v.title.length > 80) return "Title must be 80 characters or fewer."
      if (!v.propertyType) return "Choose a property type."
    }
    if (s === 1) {
      if (!v.city.trim()) return "City is required."
      if (!v.country.trim()) return "Country is required."
    }
    if (s === 3 && v.description.trim().length < 100) return "Description must be at least 100 characters."
    if (s === 5 && v.photos.length < 5) return "Upload at least 5 photos."
    if (s === 6 && v.swapDurations.length === 0) return "Select at least one swap duration type."
    if (s === 7 && !v.exchangeType) return "Choose how you want to exchange."
    if (s === 10 && (!v.emergencyName.trim() || !v.emergencyPhone.trim())) return "Emergency contact name and phone are required."
    return null
  }

  function next(skip = false) {
    if (!skip) {
      const err = screenValid(step)
      if (err) { toast(err, "error"); return }
    }
    setStep((s) => Math.min(SCREENS.length - 1, s + 1))
  }

  async function submit() {
    for (let s = 0; s < SCREENS.length - 1; s++) {
      const err = screenValid(s)
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

  const section = SCREENS[step].section
  // Per-section fill: fraction of that section's screens already passed.
  const fillFor = (i: number) => {
    const screens = SCREENS.filter((sc) => sc.section === i).length
    const done = SCREENS.filter((sc, idx) => sc.section === i && idx < step).length
    if (i < section) return 1
    if (i > section) return 0
    return (done + 0.5) / screens
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress — section name, step count, segmented bar */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-bold text-[var(--navy)]">{SECTIONS[section]}</span>
          <span className="text-xs text-neutral font-semibold">{step + 1}/{SCREENS.length}</span>
        </div>
        <div className="flex gap-1.5">
          {SECTIONS.map((s, i) => (
            <div key={s} className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div className="h-full bg-[var(--gold)] transition-all" style={{ width: `${fillFor(i) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-10 min-h-[24rem]">
        {/* 0 — Title + type */}
        {step === 0 && (
          <div>
            <Heading title="What are you listing?" sub="Give your home a short, inviting title and pick its type." />
            <div className="space-y-6">
              <div>
                <label className={label}>Property title <span className="text-neutral normal-case font-normal">({v.title.length}/80)</span></label>
                <input className={input} maxLength={80} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Sunlit apartment near the lake" />
              </div>
              <div>
                <label className={label}>Property type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PROPERTY_TYPES.map((t) => (
                    <IconCard key={t.v} icon={t.icon} title={t.v} selected={v.propertyType === t.v} onClick={() => set("propertyType", t.v)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1 — Location */}
        {step === 1 && (
          <div>
            <Heading title="Where is your home?" sub="Only the city, country, and neighbourhood are shown publicly. The full address stays encrypted until a swap is confirmed." />
            <div className="space-y-5">
              <div>
                <label className={label}>Full address <span className="text-neutral normal-case font-normal">(private)</span></label>
                <input className={input} value={v.fullAddress} onChange={(e) => set("fullAddress", e.target.value)} placeholder="12 Rue du Lac, Apt 4B" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={label}>City</label><input className={input} value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="Geneva" /></div>
                <div><label className={label}>Country</label><input className={input} value={v.country} onChange={(e) => set("country", e.target.value)} placeholder="Switzerland" /></div>
              </div>
              <div>
                <label className={label}>Neighbourhood <span className="text-neutral normal-case font-normal">(shown publicly)</span></label>
                <input className={input} value={v.neighbourhood} onChange={(e) => set("neighbourhood", e.target.value)} placeholder="Eaux-Vives" />
              </div>
            </div>
          </div>
        )}

        {/* 2 — Space */}
        {step === 2 && (
          <div>
            <Heading title="How much space is there?" sub="Bedrooms, bathrooms, and the most guests your home comfortably sleeps." />
            <div className="flex flex-wrap gap-10">
              <div><label className={label}>Bedrooms</label><Stepper value={v.bedrooms} set={(n) => set("bedrooms", n)} min={1} max={10} /></div>
              <div><label className={label}>Bathrooms</label><Stepper value={v.bathrooms} set={(n) => set("bathrooms", n)} min={1} max={6} /></div>
              <div><label className={label}>Max guests</label><Stepper value={v.maxGuests} set={(n) => set("maxGuests", n)} min={1} max={12} /></div>
            </div>
          </div>
        )}

        {/* 3 — Description */}
        {step === 3 && (
          <div>
            <Heading title="What makes your home unique?" sub="Describe the home, the neighbourhood, and what makes it a great exchange — guests read this first." />
            <div className="flex items-end justify-between gap-3 mb-2">
              <label className={`${label} mb-0`}>Description <span className="text-neutral normal-case font-normal">({v.description.trim().length}/100 min)</span></label>
              <button
                type="button"
                onClick={writeWithAi}
                disabled={aiBusy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold-dark)] border border-[var(--gold)]/50 hover:bg-[var(--parchment)] px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
              >
                <Sparkles size={13} /> {aiBusy ? "Drafting…" : "Write with AI"}
              </button>
            </div>
            <textarea rows={8} className={input} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Bright two-bed five minutes from the lake, quiet street, weekly market around the corner…" />
            <p className="mt-2 text-xs text-neutral">
              Write a few rough notes and “Write with AI” will polish them — it only uses the details you&apos;ve entered.
            </p>
          </div>
        )}

        {/* 4 — Amenities (optional) */}
        {step === 4 && (
          <div>
            <Heading title="What does your home offer?" sub="Select everything that applies — amenities help your home appear in more searches." />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AMENITIES.map((a) => (
                <IconCard key={a.v} icon={a.icon} title={a.l} selected={v.amenities.includes(a.v)} onClick={() => toggle("amenities", a.v)} />
              ))}
            </div>
          </div>
        )}

        {/* 5 — Photos */}
        {step === 5 && (
          <div>
            <Heading title="Add at least 5 pictures" sub="Start with your home's main rooms." />
            {v.photos.length === 0 ? (
              <label className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] cursor-pointer hover:border-[var(--gold)] transition-colors text-center px-4">
                <UploadCloud size={28} className="text-[var(--gold-dark)] mb-2" />
                <span className="text-sm font-semibold text-[var(--gold-dark)]">{photoBusy ? "Processing…" : "Upload pictures"}</span>
                <span className="text-xs text-neutral mt-1.5">JPG, PNG, WebP · max 10 MB · min 1080px shortest edge</span>
                <input type="file" accept={ACCEPT.join(",")} multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
              </label>
            ) : (
              <>
                <p className="text-xs text-neutral mb-3">
                  Drag and drop pictures to reorder them — the first picture is your cover photo ({v.photos.length}/20).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {v.photos.map((p, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { if (dragIdx !== null) reorder(dragIdx, i); setDragIdx(null) }}
                      onDragEnd={() => setDragIdx(null)}
                      className={`relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--background)] cursor-grab active:cursor-grabbing ${
                        i === 0 ? "col-span-2 h-56" : "h-36"
                      } ${dragIdx === i ? "opacity-60 ring-2 ring-[var(--gold)]" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => set("photos", v.photos.filter((_, x) => x !== i))}
                        aria-label={`Remove photo ${i + 1}`}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 text-[var(--navy)] flex items-center justify-center shadow hover:bg-white"
                      >
                        <X size={14} />
                      </button>
                      {i === 0 ? (
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-[var(--navy)]/90 text-white px-2.5 py-1 rounded-md">
                          Cover photo
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => reorder(i, 0)}
                          className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-white/95 text-[var(--navy)] px-2.5 py-1 rounded-md shadow hover:bg-white"
                        >
                          <Star size={11} /> Make cover
                        </button>
                      )}
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] cursor-pointer hover:border-[var(--gold)] transition-colors text-center px-3">
                    <UploadCloud size={22} className="text-[var(--gold-dark)] mb-1.5" />
                    <span className="text-xs font-semibold text-[var(--gold-dark)]">{photoBusy ? "Processing…" : "Add more pictures"}</span>
                    <input type="file" accept={ACCEPT.join(",")} multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* 6 — Durations */}
        {step === 6 && (
          <div>
            <Heading title="How long can guests stay?" sub="Pick every stay length your home is open to — this decides which requests you receive." />
            <div className="grid sm:grid-cols-2 gap-3">
              {DURATIONS.map((d) => (
                <IconCard key={d.v} icon={d.icon} title={d.l} desc={d.d} selected={v.swapDurations.includes(d.v)} onClick={() => toggle("swapDurations", d.v)} />
              ))}
            </div>
          </div>
        )}

        {/* 7 — Exchange type */}
        {step === 7 && (
          <div>
            <Heading title="How do you want to exchange?" sub="Simultaneous swaps happen at the same time; credits let you host now and stay elsewhere later." />
            <div className="grid sm:grid-cols-3 gap-3">
              {EXCHANGE_TYPES.map((t) => (
                <IconCard key={t.v} icon={t.icon} title={t.l} desc={t.d} selected={v.exchangeType === t.v} onClick={() => set("exchangeType", t.v)} />
              ))}
            </div>
          </div>
        )}

        {/* 8 — Blackouts (optional) */}
        {step === 8 && (
          <div>
            <Heading title="Any dates you're unavailable?" sub="Guests can't request stays that overlap these ranges. You can change them anytime." />
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
        )}

        {/* 9 — House rules (optional) */}
        {step === 9 && (
          <div>
            <Heading title="Any house rules?" sub="Shown to guests before they send a request — set expectations early." />
            <textarea rows={6} maxLength={1000} className={input} value={v.houseRules} onChange={(e) => set("houseRules", e.target.value)} placeholder="No smoking, no shoes indoors, please water the plants." />
          </div>
        )}

        {/* 10 — Emergency contact */}
        {step === 10 && (
          <div>
            <Heading title="Who can guests call if something goes wrong?" sub="Encrypted, and only shared with a confirmed swap partner." />
            <div className="rounded-xl bg-[var(--parchment)] border border-[var(--gold)]/20 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={label}>Contact name</label><input className={input} value={v.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} /></div>
                <div><label className={label}>Phone</label><input className={input} value={v.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} placeholder="+41 …" /></div>
              </div>
              <div><label className={label}>Relationship to property</label><input className={input} value={v.emergencyRelationship} onChange={(e) => set("emergencyRelationship", e.target.value)} placeholder="Building manager, neighbour…" /></div>
            </div>
          </div>
        )}

        {/* 11 — Review */}
        {step === 11 && (
          <div>
            <Heading title="Ready to save?" sub="Your listing is saved as a draft — publish it from My Listings whenever you're ready." />
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

      </div>

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--navy)] px-5 py-2.5 rounded-full border border-[var(--border)] hover:border-[var(--navy)] bg-white"><ChevronLeft size={16} /> Back</button>
        ) : (
          <Link href="/dashboard/listings" className="text-sm font-semibold text-neutral hover:text-[var(--navy)] px-2">Cancel</Link>
        )}
        <div className="flex items-center gap-3">
          {SCREENS[step].optional && step < SCREENS.length - 1 && (
            <button type="button" onClick={() => next(true)} className="text-sm font-semibold text-[var(--navy)] px-5 py-2.5 rounded-full border border-[var(--gold)] hover:bg-[var(--parchment)] bg-white">Skip</button>
          )}
          {step < SCREENS.length - 1 ? (
            <button type="button" onClick={() => next()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-7 py-2.5 rounded-full shadow-sm">Continue <ChevronRight size={16} /></button>
          ) : (
            <button type="button" onClick={submit} disabled={loading} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-7 py-2.5 rounded-full shadow-sm disabled:opacity-50">{loading ? "Saving…" : (<><Check size={16} /> Save listing</>)}</button>
          )}
        </div>
      </div>
    </div>
  )
}
