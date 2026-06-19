"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, ArrowRight, Home, Compass, PartyPopper } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { ProfileForm, type ProfileValues } from "@/components/profile/profile-form"

const STEPS = ["Welcome", "Your profile", "Your first home", "Explore"]

export function OnboardingWizard({
  firstName,
  initialProfile,
  initialCompletion,
}: {
  firstName: string
  initialProfile: ProfileValues
  initialCompletion: number
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [completion, setCompletion] = useState(initialCompletion)
  const [hint, setHint] = useState("")
  const [leaving, setLeaving] = useState(false)

  async function finishAndGo(path: string) {
    setLeaving(true)
    try {
      await fetch("/api/onboarding/finish", { method: "POST" })
    } catch {
      /* proceed regardless */
    }
    router.push(path)
    router.refresh()
  }

  return (
    <div className="w-full max-w-xl">
      <div className="flex justify-center mb-8">
        <Logo underline wordClassName="text-[var(--navy)]" />
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = n < step
          const active = n === step
          return (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${done || active ? "bg-[var(--gold)]" : "bg-[var(--border)]"}`} />
              <div className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wide ${active ? "text-[var(--navy)]" : "text-neutral"}`}>{label}</div>
            </div>
          )
        })}
      </div>

      <div className="bg-surface rounded-3xl border border-[var(--border)] shadow-xl p-8">
        {/* Step 1 — Welcome + Mission */}
        {step === 1 && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--navy)] text-[var(--gold)] flex items-center justify-center mb-5">
              <ShieldCheck size={26} />
            </div>
            <h1 className="font-display text-3xl font-bold text-[var(--navy)]">Welcome to UnSwap, {firstName}</h1>
            <p className="mt-4 text-neutral leading-relaxed">
              You&apos;ve joined a closed, verified network built exclusively for UN and
              international organisation professionals. Exchange homes, not money —
              and travel on rotation with peers who have as much to protect as you do.
            </p>
            <button
              onClick={() => setStep(2)}
              className="mt-8 inline-flex items-center gap-2 py-3 px-7 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors shadow-sm"
            >
              Get started <ArrowRight size={17} />
            </button>
          </div>
        )}

        {/* Step 2 — Complete your profile (needs 50% to proceed) */}
        {step === 2 && (
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--navy)]">Complete your profile</h1>
            <p className="mt-1 text-sm text-neutral">Members exchange with people, not listings. Reach 50% to continue.</p>
            <div className="mt-4 mb-6">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-dark">Profile completion</span>
                <span className="font-bold text-[var(--gold-dark)]">{completion}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-light overflow-hidden">
                <div className="h-full bg-[var(--gold)] transition-all" style={{ width: `${completion}%` }} />
              </div>
              {hint && <p className="mt-2 text-xs text-[var(--crimson)] font-medium">{hint}</p>}
            </div>
            <ProfileForm
              initial={initialProfile}
              submitLabel="Save & continue"
              onSaved={(c) => {
                setCompletion(c)
                if (c >= 50) { setHint(""); setStep(3) }
                else setHint(`You're at ${c}% — add a little more to reach 50% and continue.`)
              }}
            />
          </div>
        )}

        {/* Step 3 — List your first property (skippable) */}
        {step === 3 && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--teal-light)] text-[var(--teal)] flex items-center justify-center mb-5">
              <Home size={26} />
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--navy)]">List your first home</h1>
            <p className="mt-3 text-neutral leading-relaxed">
              Add the home you&apos;d like to offer for exchange. You can publish it once
              you&apos;re fully verified — or add it later.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => finishAndGo("/dashboard/listings/new")} disabled={leaving} className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 transition-colors">
                Add my home <ArrowRight size={16} />
              </button>
              <button onClick={() => setStep(4)} disabled={leaving} className="py-3 px-6 rounded-xl text-sm font-semibold text-[var(--navy)] border border-[var(--border)] hover:border-[var(--navy)] transition-colors">
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Explore */}
        {step === 4 && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--gold)]/15 text-[var(--gold-dark)] flex items-center justify-center mb-5">
              <PartyPopper size={26} />
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--navy)]">You&apos;re all set</h1>
            <p className="mt-3 text-neutral leading-relaxed">
              Discover verified homes across duty stations worldwide, save your
              favourites, and send your first swap request.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => finishAndGo("/dashboard/browse")} disabled={leaving} className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 transition-colors">
                <Compass size={16} /> Explore homes
              </button>
              <button onClick={() => finishAndGo("/dashboard")} disabled={leaving} className="py-3 px-6 rounded-xl text-sm font-semibold text-[var(--navy)] border border-[var(--border)] hover:border-[var(--navy)] transition-colors">
                Go to my dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
