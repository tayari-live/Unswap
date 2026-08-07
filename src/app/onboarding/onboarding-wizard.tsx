"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRight, ArrowLeft, Home, Compass, PartyPopper } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { type ProfileValues } from "@/components/profile/profile-form"
import { ProfileWizard } from "@/components/profile/profile-wizard"
import { SectionLabel, LUX_GOLD_BTN, LUX_GHOST_BTN } from "@/components/ui/lux"

const STEPS = ["Welcome", "Your profile", "Get started"]

// How complete a profile must be before onboarding lets you move on. Members can
// finish the rest later; the dashboard checklist keeps nudging toward 100%.
const MIN_TO_CONTINUE = 50

export function OnboardingWizard({
  firstName,
  initialProfile,
}: {
  firstName: string
  initialProfile: ProfileValues
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [hint, setHint] = useState("")
  const [leaving, setLeaving] = useState(false)

  // The profile step nests ProfileWizard, which brings its own progress and
  // Back button — so the outer chrome steps aside while it is on screen.
  const ownsScreen = step === 2

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

      {/*
        Progress. Hidden on the profile step: that screen hands the stage to
        ProfileWizard, which carries its own progress and Back control. Two of
        each on one screen makes "Back" ambiguous.
      */}
      {!ownsScreen && (
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
      )}

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
            <h1 className="font-sans text-4xl font-light leading-[1.1] text-[var(--fg)]">Welcome to UnSwap, {firstName}</h1>
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
            <h1 className="font-sans text-3xl font-light leading-[1.15] text-[var(--fg)]">Complete your profile</h1>
            <p className="mt-2 mb-6 text-sm text-neutral leading-relaxed">
              Members exchange with people, not listings. One question at a time. Reach {MIN_TO_CONTINUE}% to continue.
            </p>
            {hint && <p className="mb-4 text-xs text-[var(--crimson)] font-medium">{hint}</p>}
            <ProfileWizard
              initial={initialProfile}
              onExit={() => { setHint(""); setStep(1) }}
              onSaved={(c) => {
                if (c >= MIN_TO_CONTINUE) { setHint(""); setStep(3) }
                else setHint(`You are at ${c}%. Add a little more to reach ${MIN_TO_CONTINUE}% and continue.`)
              }}
            />
          </div>
        )}

        {/*
          Step 3 — one destination screen. Previously two screens ("list a home?"
          then "explore?") that asked the same question: where do you want to land.
        */}
        {step === 3 && (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 border border-[var(--hair)] text-[var(--gold-soft)] flex items-center justify-center mb-6">
              <PartyPopper size={26} strokeWidth={1.4} />
            </div>
            <SectionLabel align="center">Ready</SectionLabel>
            <h1 className="font-sans text-3xl font-light leading-[1.15] text-[var(--fg)]">You are all set, {firstName}</h1>
            <p className="mt-4 text-neutral leading-[1.8] max-w-md mx-auto">
              Offer your home for exchange, or start with the homes your peers have
              already listed across duty stations worldwide.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => finishAndGo("/dashboard/listings/new")} disabled={leaving} className={`${LUX_GOLD_BTN} disabled:opacity-50`}>
                <Home size={16} /> Add my home
              </button>
              <button onClick={() => finishAndGo("/dashboard/browse")} disabled={leaving} className={`${LUX_GHOST_BTN} disabled:opacity-50`}>
                <Compass size={16} /> Explore homes
              </button>
            </div>

            <button
              onClick={() => finishAndGo("/dashboard")}
              disabled={leaving}
              className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral hover:text-[var(--gold-soft)] disabled:opacity-50 transition-colors"
            >
              Go to my dashboard
            </button>
          </div>
        )}
      </div>

      {/* ProfileWizard owns Back while it is on screen, so only one is ever shown. */}
      {step > 1 && !ownsScreen && (
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
