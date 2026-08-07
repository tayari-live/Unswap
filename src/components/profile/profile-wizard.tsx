"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UploadCloud, X, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { NATIONALITIES } from "@/lib/geo"
import type { ProfileValues } from "@/components/profile/profile-form"
import { FIELD, LABEL, TEXTAREA } from "@/components/ui/form"

// Field styling lives in components/ui/form so all forms stay in step.
const input = FIELD
const label = LABEL

const ORGANISATIONS = [
  "United Nations", "UNDP", "UNICEF", "WHO", "UNHCR", "IMF", "World Bank Group",
  "ILO", "FAO", "WFP", "UNAIDS", "UNEP", "UNFPA", "UN-Habitat", "OCHA", "Other",
]
// A bio only earns its place if it says something. Short enough to write in one
// sitting, long enough to be more than a job title. Skipping remains an option.
const MIN_BIO = 40

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = "image/png,image/jpeg,image/webp"


// The fields that count toward profile completion — must match the server's
// computeCompletion() so the live % matches what gets saved. LinkedIn is
// deliberately excluded: it is optional, so scoring it would make 100%
// unreachable for anyone who skips it.
const COMPLETION_FIELDS: (keyof ProfileValues)[] = [
  "fullName", "imageUrl", "nationality", "dutyStation", "organisation", "languages", "bio",
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
  { key: "organisation" },
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
      <h2 className="font-sans text-2xl sm:text-[2rem] font-light text-[var(--fg)] leading-[1.15]">{title}</h2>
      {sub && <p className="mt-2.5 text-sm text-neutral leading-relaxed">{sub}</p>}
    </div>
  )
}

export function ProfileWizard({
  initial,
  onSaved,
  onExit,
}: {
  initial: ProfileValues
  onSaved?: (completion: number) => void
  /** Back pressed on the first question — lets a host flow reclaim the screen. */
  onExit?: () => void
}) {
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
    if (SCREENS[s].key === "bio") {
      const len = v.bio.trim().length
      if (len > 0 && len < MIN_BIO) return `A sentence or two works best — ${MIN_BIO - len} more character${MIN_BIO - len === 1 ? "" : "s"} to go.`
    }
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

  // Continue requires the current question to be answered; use Skip to pass an
  // optional question without answering. Photo counts as answered once added;
  // the review screen has no field to fill.
  const answered =
    key === "review"
      ? true
      : key === "photo"
      ? !!v.imageUrl
      : key === "bio"
      ? v.bio.trim().length >= MIN_BIO
      : String((v as any)[key] ?? "").trim().length > 0

  return (
    <div>
      {/* Progress — live profile completion % + step count */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--gold-soft)]">Profile completion · {completion}%</span>
          <span className="text-[11px] text-neutral font-medium uppercase tracking-[0.14em]">Step {step + 1}/{SCREENS.length}</span>
        </div>
        <div className="h-px bg-[var(--hair)] overflow-hidden">
          <div className="h-full bg-[var(--gold)] transition-all duration-300" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-md border border-[var(--hair)] p-6 sm:p-10 min-h-[22rem]">
        {key === "photo" && (
          <div>
            <Heading title="Add a profile photo" sub="A friendly face helps other members recognise and trust you." />
            <div className="flex items-center gap-5">
              {v.imageUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.imageUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border border-[var(--hair)]" />
                  <button type="button" onClick={() => set("imageUrl", null)} aria-label="Remove photo" className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--hair)] text-[var(--fg)] flex items-center justify-center shadow">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 rounded-full border-2 border-dashed border-[var(--hair)] bg-[var(--background)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--gold)] transition-colors text-neutral">
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
            <label className={label} htmlFor="fullName">Display name</label>
            <input id="fullName" className={input} value={v.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Amara Okafor" />
          </div>
        )}

        {key === "organisation" && (
          <div>
            <Heading title="Where do you work?" sub="Your organisation, so members can see you're part of the community." />
            <label className={label} htmlFor="organisation">Organisation</label>
            <select id="organisation" className={input} value={v.organisation} onChange={(e) => set("organisation", e.target.value)}>
              <option value="">Select…</option>
              {orgOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}

        {key === "nationality" && (
          <div>
            <Heading title="What's your nationality?" sub="Shown on your profile to help build a sense of community." />
            <label className={label} htmlFor="nationality">Nationality</label>
            <select id="nationality" className={input} value={v.nationality} onChange={(e) => set("nationality", e.target.value)}>
              <option value="">Select…</option>
              {nationalityOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        {key === "dutyStation" && (
          <div>
            <Heading title="Where are you based?" sub="Your current duty station." />
            <label className={label} htmlFor="dutyStation">Current duty station</label>
            <input id="dutyStation" className={input} value={v.dutyStation} onChange={(e) => set("dutyStation", e.target.value)} placeholder="Geneva" />
          </div>
        )}

        {key === "languages" && (
          <div>
            <Heading title="Which languages do you speak?" sub="Helpful for members considering an exchange with you." />
            <label className={label} htmlFor="languages">Languages</label>
            <input id="languages" className={input} value={v.languages} onChange={(e) => set("languages", e.target.value)} placeholder="English, French" />
          </div>
        )}

        {key === "bio" && (
          <div>
            <Heading title="Tell members about yourself" sub="A short introduction. Your work, your interests, what you are looking for." />
            <label className={label} htmlFor="bio">Bio</label>
            <textarea id="bio" className={TEXTAREA} value={v.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A short introduction for fellow members." />
            <p className="mt-2 text-xs text-neutral">
              {v.bio.trim().length === 0
                ? `At least ${MIN_BIO} characters, or skip this for now.`
                : v.bio.trim().length < MIN_BIO
                ? `${MIN_BIO - v.bio.trim().length} more character${MIN_BIO - v.bio.trim().length === 1 ? "" : "s"} to go.`
                : "Looks good."}
            </p>
          </div>
        )}

        {key === "linkedinUrl" && (
          <div>
            <Heading title="Add your LinkedIn" sub="Optional — an extra signal of trust for potential swap partners." />
            <label className={label} htmlFor="linkedinUrl">LinkedIn <span className="text-neutral normal-case font-normal">(optional)</span></label>
            <input id="linkedinUrl" className={input} value={v.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/…" />
          </div>
        )}

        {key === "review" && (
          <div>
            <Heading title="Review your profile" sub={`Your profile is ${completion}% complete. Save to update it.`} />
            <dl className="text-sm divide-y divide-[var(--hair)] border border-[var(--hair)] rounded-xl overflow-hidden">
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
                <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-neutral">{k}</dt><dd className="font-medium text-[var(--fg)] text-right truncate">{val}</dd></div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between gap-3">
        {step > 0 || onExit ? (
          <button
            type="button"
            onClick={() => (step > 0 ? setStep((s) => s - 1) : onExit?.())}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--fg)] px-5 py-3 rounded-sm border border-[var(--hair)] hover:border-[var(--gold)] bg-[var(--surface)] transition-colors"
          >
            <ChevronLeft size={15} /> Back
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {SCREENS[step].optional && step < SCREENS.length - 1 && (
            <button type="button" onClick={() => next(true)} className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--gold-soft)] px-5 py-3 rounded-sm border border-[var(--hair)] hover:border-[var(--gold)] bg-[var(--surface)] transition-colors">Skip</button>
          )}
          {step < SCREENS.length - 1 ? (
            <button type="button" onClick={() => next()} disabled={!answered} title={!answered ? "Answer this question or use Skip" : undefined} className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-ink bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-7 py-3 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--gold)]">Continue <ChevronRight size={15} /></button>
          ) : (
            <button type="button" onClick={submit} disabled={loading} className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-ink bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-7 py-3 rounded-sm transition-colors disabled:opacity-50">{loading ? "Saving…" : (<><Check size={15} /> Save profile</>)}</button>
          )}
        </div>
      </div>
    </div>
  )
}
