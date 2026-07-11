"use client"

import { useState } from "react"
import { UploadCloud, X, Check } from "lucide-react"
import { useToast } from "@/components/ui/toast"

const ORGANISATIONS = [
  "United Nations", "UNDP", "UNICEF", "WHO", "UNHCR", "IMF", "World Bank Group",
  "ILO", "FAO", "WFP", "UNAIDS", "UNEP", "UNFPA", "UN-Habitat", "OCHA", "Other",
]
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = "image/png,image/jpeg,image/webp"

export type ProfileValues = {
  fullName: string
  imageUrl: string | null
  nationality: string
  dutyStation: string
  organisation: string
  languages: string
  bio: string
  linkedinUrl: string
}

const inputCls =
  "block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"

export function ProfileForm({
  initial,
  submitLabel = "Save profile",
  onSaved,
}: {
  initial: ProfileValues
  submitLabel?: string
  onSaved?: (completion: number) => void
}) {
  const toast = useToast()
  const [v, setV] = useState<ProfileValues>(initial)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof ProfileValues>(k: K, val: ProfileValues[K]) =>
    setV((p) => ({ ...p, [k]: val }))

  function pickFile(file: File | undefined) {
    if (!file) return
    if (!ACCEPT.split(",").includes(file.type)) return toast("Photo must be a PNG, JPG, or WebP image.", "error")
    if (file.size > MAX_BYTES) return toast("That image is over 5 MB.", "error")
    const reader = new FileReader()
    reader.onload = () => set("imageUrl", reader.result as string)
    reader.readAsDataURL(file)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    setLoading(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not save your profile.", "error")
        setLoading(false)
        return
      }
      setSaved(true)
      setLoading(false)
      toast("Profile saved.", "success")
      onSaved?.(data.completion ?? 0)
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  const orgOptions = ORGANISATIONS.includes(v.organisation) || !v.organisation
    ? ORGANISATIONS
    : [v.organisation, ...ORGANISATIONS]

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Photo */}
      <div className="flex items-center gap-4">
        {v.imageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.imageUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border border-[var(--border)]" />
            <button type="button" onClick={() => set("imageUrl", null)} aria-label="Remove photo" className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border border-[var(--border)] text-[var(--navy)] flex items-center justify-center shadow">
              <X size={13} />
            </button>
          </div>
        ) : (
          <label className="w-20 h-20 rounded-full border-2 border-dashed border-[var(--border)] bg-[var(--background)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--gold)] transition-colors text-neutral">
            <UploadCloud size={18} />
            <input type="file" accept={ACCEPT} className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          </label>
        )}
        <div>
          <div className="text-sm font-semibold text-[var(--navy)]">Profile photo</div>
          <div className="text-xs text-neutral">PNG, JPG or WebP · max 5 MB</div>
        </div>
      </div>

      <div>
        <label htmlFor="fullName" className={labelCls}>Display name</label>
        <input id="fullName" required value={v.fullName} onChange={(e) => set("fullName", e.target.value)} className={inputCls} placeholder="Amara Okafor" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="organisation" className={labelCls}>Organisation</label>
          <select id="organisation" value={v.organisation} onChange={(e) => set("organisation", e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {orgOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nationality" className={labelCls}>Nationality</label>
          <input id="nationality" value={v.nationality} onChange={(e) => set("nationality", e.target.value)} className={inputCls} placeholder="Nigerian" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="dutyStation" className={labelCls}>Current duty station</label>
          <input id="dutyStation" value={v.dutyStation} onChange={(e) => set("dutyStation", e.target.value)} className={inputCls} placeholder="Geneva" />
        </div>
        <div>
          <label htmlFor="languages" className={labelCls}>Languages</label>
          <input id="languages" value={v.languages} onChange={(e) => set("languages", e.target.value)} className={inputCls} placeholder="English, French" />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className={labelCls}>Bio</label>
        <textarea id="bio" rows={3} value={v.bio} onChange={(e) => set("bio", e.target.value)} className={inputCls} placeholder="A short introduction for fellow members." />
      </div>

      <div>
        <label htmlFor="linkedinUrl" className={labelCls}>LinkedIn <span className="text-neutral normal-case font-normal">(optional)</span></label>
        <input id="linkedinUrl" value={v.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} className={inputCls} placeholder="https://linkedin.com/in/…" />
      </div>

      <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 transition-colors shadow-sm">
        {loading ? "Saving…" : saved ? (<><Check size={16} /> Saved</>) : submitLabel}
      </button>
    </form>
  )
}
