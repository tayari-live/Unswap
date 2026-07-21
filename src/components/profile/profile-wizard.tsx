"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UploadCloud, X, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { NATIONALITIES } from "@/lib/geo"
import type { ProfileValues } from "@/components/profile/profile-form"

const ORGANISATIONS = [
  "United Nations", "UNDP", "UNICEF", "WHO", "UNHCR", "IMF", "World Bank Group",
  "ILO", "FAO", "WFP", "UNAIDS", "UNEP", "UNFPA", "UN-Habitat", "OCHA", "Other",
]
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = "image/png,image/jpeg,image/webp"

const input =
  "block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)]"
const label = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"

// The eight fields that count toward profile completion — must match the
// server's computeCompletion() so the live % matches what gets saved.
const COMPLETION_FIELDS: (keyof ProfileValues)[] = [
  "fullName", "imageUrl", "nationality", "dutyStation", "organisation", "languages", "bio", "linkedinUrl",
]
function completionOf(v: ProfileValues): number {
  const filled = COMPLETION_FIELDS.filter((k) => {
    const val = v[k]
    return val != null && String(val).trim().length > 0
  }).length
  return Math.round((filled / COMPLETION_FIELDS.length) * 100)
}

// One field per screen; `optional` screens may be skipped.
const SCREENS: { key: keyof ProfileValues | "photo" | "review"; optional?: boolean }[] = [
  { key: "photo", optional: true },
  { key: "fullName" },
  { key: "organisation", optional: true },
  { key: "nationality", optional: true },
  { key: "dutyStation", optional: true },
  { key: "languages", optional: true },
  { key: "bio", optional: true },
  { key: "linkedinUrl", optional: true },
  { key: "review" },
]

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--navy)] leading-tight">{title}</h2>
      {sub && <p className="mt-2 text-sm text-neutral leading-relaxed">{sub}</p>}
    </div>
  )
}

export function ProfileWizard({ initial, onSaved }: { initial: ProfileValues; onSaved?: (completion: number) => void }) {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [v, setV] = useState<ProfileValues>(initial)
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof ProfileValues>(k: K, val: ProfileValues[K]) => setV((p) => ({ ...p, [k]: val }))

  const completion = completionOf(v)

  function pickFile(file: File | undefined) {
    if (!file) return
    if (!ACCEPT.split(",").includes(file.type)) return toast("Photo must be a PNG, JPG, or WebP image.", "error")
    if (file.size > MAX_BYTES) return toast("That image is over 5 MB.", "error")
    const reader = new FileReader()
    reader.onload = () => set("imageUrl", reader.result as string)
    reader.readAsDataURL(file)
  }

  function screenValid(s: number): string | null {
    if (SCREENS[s].key === "fullName" && !v.fullName.trim()) return "Display name is required."
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
    const err = screenValid(1) // name is the only hard requirement
    if (err) { toast(err, "error"); setStep(1); return }
    setLoading(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error || "Could not save your profile.", "error"); setLoading(false); return }
      toast("Profile saved.", "success")
      if (onSaved) {
        // Onboarding flow: hand control back to the parent (advances the step).
        onSaved(data.completion ?? completion)
        router.refresh()
      } else {
        // Standalone profile page: return to the dashboard after saving.
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      toast("Something went wrong. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  const orgOptions = ORGANISATIONS.includes(v.organisation) || !v.organisation ? ORGANISATIONS : [v.organisation, ...ORGANISATIONS]
  const nationalityOptions = NATIONALITIES.includes(v.nationality) || !v.nationality ? NATIONALITIES : [v.nationality, ...NATIONALITIES]

  const key = SCREENS[step].key

  return (
    <div>
      {/* Progress — live profile completion % + step count */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-bold text-[var(--navy)]">Profile completion · {completion}%</span>
          <span className="text-xs text-neutral font-semibold">Step {step + 1}/{SCREENS.length}</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
          <div className="h-full bg-[var(--gold)] transition-all duration-300" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-10 min-h-[22rem]">
        {key === "photo" && (
          <div>
            <Heading title="Add a profile photo" sub="A friendly face helps other members recognise and trust you." />
            <div className="flex items-center gap-5">
              {v.imageUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.imageUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border border-[var(--border)]" />
                  <button type="button" onClick={() => set("imageUrl", null)} aria-label="Remove photo" className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white border border-[var(--border)] text-[var(--navy)] flex items-center justify-center shadow">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 rounded-full border-2 border-dashed border-[var(--border)] bg-[var(--background)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--gold)] transition-colors text-neutral">
                  <UploadCloud size={20} />
                  <input type="file" accept={ACCEPT} className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
                </label>
              )}
              <div className="text-sm text-neutral">PNG, JPG or WebP · max 5 MB</div>
            </div>
          </div>
        )}

        {key === "fullName" && (
          <div>
            <Heading title="What's your name?" sub="This is how you'll appear to other members of the network." />
            <label className={label}>Display name</label>
            <input className={input} value={v.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Amara Okafor" />
          </div>
        )}

        {key === "organisation" && (
          <div>
            <Heading title="Where do you work?" sub="Your organisation, so members can see you're part of the community." />
            <label className={label}>Organisation</label>
            <select className={input} value={v.organisation} onChange={(e) => set("organisation", e.target.value)}>
              <option value="">Select…</option>
              {orgOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}

        {key === "nationality" && (
          <div>
            <Heading title="What's your nationality?" sub="Shown on your profile to help build a sense of community." />
            <label className={label}>Nationality</label>
            <select className={input} value={v.nationality} onChange={(e) => set("nationality", e.target.value)}>
              <option value="">Select…</option>
              {nationalityOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        {key === "dutyStation" && (
          <div>
            <Heading title="Where are you based?" sub="Your current duty station." />
            <label className={label}>Current duty station</label>
            <input className={input} value={v.dutyStation} onChange={(e) => set("dutyStation", e.target.value)} placeholder="Geneva" />
          </div>
        )}

        {key === "languages" && (
          <div>
            <Heading title="Which languages do you speak?" sub="Helpful for members considering an exchange with you." />
            <label className={label}>Languages</label>
            <input className={input} value={v.languages} onChange={(e) => set("languages", e.target.value)} placeholder="English, French" />
          </div>
        )}

        {key === "bio" && (
          <div>
            <Heading title="Tell members about yourself" sub="A short introduction — your work, your interests, what you're looking for." />
            <label className={label}>Bio</label>
            <textarea rows={5} className={input} value={v.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A short introduction for fellow members." />
          </div>
        )}

        {key === "linkedinUrl" && (
          <div>
            <Heading title="Add your LinkedIn" sub="Optional — an extra signal of trust for potential swap partners." />
            <label className={label}>LinkedIn <span className="text-neutral normal-case font-normal">(optional)</span></label>
            <input className={input} value={v.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/…" />
          </div>
        )}

        {key === "review" && (
          <div>
            <Heading title="Review your profile" sub={`Your profile is ${completion}% complete. Save to update it.`} />
            <dl className="text-sm divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
              {[
                ["Photo", v.imageUrl ? "Added" : "—"],
                ["Display name", v.fullName || "—"],
                ["Organisation", v.organisation || "—"],
                ["Nationality", v.nationality || "—"],
                ["Duty station", v.dutyStation || "—"],
                ["Languages", v.languages || "—"],
                ["Bio", v.bio ? `${v.bio.trim().slice(0, 40)}${v.bio.trim().length > 40 ? "…" : ""}` : "—"],
                ["LinkedIn", v.linkedinUrl || "—"],
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
          <span />
        )}
        <div className="flex items-center gap-3">
          {SCREENS[step].optional && step < SCREENS.length - 1 && (
            <button type="button" onClick={() => next(true)} className="text-sm font-semibold text-[var(--navy)] px-5 py-2.5 rounded-full border border-[var(--gold)] hover:bg-[var(--parchment)] bg-white">Skip</button>
          )}
          {step < SCREENS.length - 1 ? (
            <button type="button" onClick={() => next()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-7 py-2.5 rounded-full shadow-sm">Continue <ChevronRight size={16} /></button>
          ) : (
            <button type="button" onClick={submit} disabled={loading} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-7 py-2.5 rounded-full shadow-sm disabled:opacity-50">{loading ? "Saving…" : (<><Check size={16} /> Save profile</>)}</button>
          )}
        </div>
      </div>
    </div>
  )
}
