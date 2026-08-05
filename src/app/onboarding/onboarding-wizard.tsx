"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRight, ArrowLeft, Home, Compass, PartyPopper } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { type ProfileValues } from "@/components/profile/profile-form"
import { ProfileWizard } from "@/components/profile/profile-wizard"
import { SectionLabel, LUX_GOLD_BTN, LUX_GHOST_BTN } from "@/components/ui/lux"

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
        <Logo underline wordClassName="text-[var(--fg)]" />
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = n < step
          const active = n === step
          return (
            <div key={label} className="flex-1">
              <div className={`h-px transition-colors ${done || active ? "bg-[var(--gold)]" : "bg-[var(--hair)]"}`} />
              <div className={`mt-2 text-[10px] font-medium uppercase tracking-[0.18em] ${active ? "text-[var(--gold-soft)]" : "text-neutral"}`}>{label}</div>
            </div>
          )
        })}
      </div>

      <div className="bg-[var(--surface)] rounded-md border border-[var(--hair)] p-8 sm:p-10">
        {/* Step 1 — Welcome + Mission */}
        {step === 1 && (
          <div className="text-center">
            <Image
              src="/unswap-logo.png"
              alt="UnSwap"
              width={64}
              height={64}
              priority
              className="mx-auto mb-5 w-16 h-16 object-contain rounded-2xl"
            />
            <SectionLabel align="center">Welcome</SectionLabel>
            <h1 className="font-display text-4xl font-light leading-[1.1] text-[var(--fg)]">Welcome to UnSwap, {firstName}</h1>
            <p className="mt-5 text-neutral leading-[1.8] max-w-md mx-auto">
              You have joined a closed, verified network built exclusively for UN and
              international organisation professionals. Exchange homes, not money,
              and travel on rotation with peers who have as much to protect as you do.
            </p>
            <button onClick={() => setStep(2)} className={`${LUX_GOLD_BTN} mt-9`}>
              Get started <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2 — Complete your profile (needs 50% to proceed) */}
        {step === 2 && (
          <div>
            <SectionLabel>Your Profile</SectionLabel>
            <h1 className="font-display text-3xl font-light leading-[1.15] text-[var(--fg)]">Complete your profile</h1>
            <p className="mt-2 mb-6 text-sm text-neutral leading-relaxed">
              Members exchange with people, not listings. One question at a time. Reach 50% to continue.
            </p>
            {hint && <p className="mb-4 text-xs text-[var(--crimson)] font-medium">{hint}</p>}
            <ProfileWizard
              initial={initialProfile}
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
            <div className="mx-auto w-16 h-16 border border-[var(--hair)] text-[var(--gold-soft)] flex items-center justify-center mb-6">
              <Home size={26} strokeWidth={1.4} />
            </div>
            <SectionLabel align="center">Your Home</SectionLabel>
            <h1 className="font-display text-3xl font-light leading-[1.15] text-[var(--fg)]">List your first home</h1>
            <p className="mt-4 text-neutral leading-[1.8] max-w-md mx-auto">
              Add the home you would like to offer for exchange. You can publish it once
              you are fully verified, or add it later.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => finishAndGo("/dashboard/listings/new")} disabled={leaving} className={`${LUX_GOLD_BTN} disabled:opacity-50`}>
                Add my home <ArrowRight size={16} />
              </button>
              <button onClick={() => setStep(4)} disabled={leaving} className={`${LUX_GHOST_BTN} disabled:opacity-50`}>
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Explore */}
        {step === 4 && (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 border border-[var(--hair)] text-[var(--gold-soft)] flex items-center justify-center mb-6">
              <PartyPopper size={26} strokeWidth={1.4} />
            </div>
            <SectionLabel align="center">Ready</SectionLabel>
            <h1 className="font-display text-3xl font-light leading-[1.15] text-[var(--fg)]">You are all set</h1>
            <p className="mt-4 text-neutral leading-[1.8] max-w-md mx-auto">
              Discover verified homes across duty stations worldwide, save your
              favourites, and send your first swap request.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => finishAndGo("/dashboard/browse")} disabled={leaving} className={`${LUX_GOLD_BTN} disabled:opacity-50`}>
                <Compass size={16} /> Explore homes
              </button>
              <button onClick={() => finishAndGo("/dashboard")} disabled={leaving} className={`${LUX_GHOST_BTN} disabled:opacity-50`}>
                Go to my dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {step > 1 && (
        <button
          type="button"
          onClick={() => { setHint(""); setStep((s) => Math.max(1, s - 1)) }}
          disabled={leaving}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral hover:text-[var(--fg)] disabled:opacity-50 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}
    </div>
  )
}
