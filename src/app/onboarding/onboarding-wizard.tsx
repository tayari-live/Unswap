"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowLeft, Home, PartyPopper } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { type ProfileValues } from "@/components/profile/profile-form"
import { ProfileWizard } from "@/components/profile/profile-wizard"
import { ListingWizard } from "@/app/(member)/dashboard/listings/listing-wizard"
import { SectionLabel, LUX_GOLD_BTN } from "@/components/ui/lux"
import { useToast } from "@/components/ui/toast"

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
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [leaving, setLeaving] = useState(false)

  // The profile step nests ProfileWizard, which brings its own progress and
  // Back button — so the outer chrome steps aside while it is on screen.
  const ownsScreen = step === 2 || step === 4

  /**
   * Called once the property is saved. Marking onboarding complete here — not
   * before — is what makes the step mandatory: the member layout sends anyone
   * without `onboardedAt` back to this wizard, so there is no route into the
   * app that skips it.
   */
  async function finish() {
    setLeaving(true)
    try {
      const res = await fetch("/api/onboarding/finish", { method: "POST" })
      if (!res.ok) {
        // fetch resolves on a 4xx, so this has to be checked explicitly —
        // navigating anyway would land on the dashboard, fail the gate, and
        // bounce straight back here with no explanation.
        const data = await res.json().catch(() => ({}))
        toast(data.error || "Could not finish setting up your account.", "error")
        setLeaving(false)
        return
      }
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLeaving(false)
      return
    }
    // Hard navigation so the dashboard renders with onboarding already marked
    // complete, rather than from a payload cached moments earlier.
    window.location.assign("/dashboard")
  }

  return (
    <div className="w-full max-w-xl">
      <div className="flex justify-center mb-8">
        <Logo underline wordClassName="text-[var(--fg)]" />
      </div>

      {/* The profile step nests ProfileWizard, which brings its own card; wrap
          the framing steps only, so step 2 isn't a card inside a card. */}
      <div className={ownsScreen ? "" : "bg-[var(--surface)] rounded-md border border-[var(--hair)] p-8 sm:p-10"}>
        {/* Step 1 — Welcome + Mission */}
        {step === 1 && (
          <div className="text-center">
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

        {/* Step 2 — Complete your profile (needs 50% to proceed). ProfileWizard
            carries its own heading, progress, and card — no extra chrome here. */}
        {step === 2 && (
          <ProfileWizard
            initial={initialProfile}
            onExit={() => setStep(1)}
            onSaved={(c) => {
              if (c >= MIN_TO_CONTINUE) setStep(3)
              else toast(`You are at ${c}%. Add a little more to reach ${MIN_TO_CONTINUE}% and continue.`, "info")
            }}
          />
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
              One last step: add your home so peers across duty stations can find it
              and start exchanging with you.
            </p>

            <div className="mt-9 flex justify-center">
              <button onClick={() => setStep(4)} disabled={leaving} className={`${LUX_GOLD_BTN} disabled:opacity-50`}>
                <Home size={16} /> Add your property
              </button>
            </div>
          </div>
        )}

        {/*
          Step 4 — the property itself, inside the flow rather than a hand-off
          to /dashboard/listings/new. Sending members into the app to add it
          meant onboarding was already marked complete when they arrived, so
          they could simply navigate to the dashboard and never add one.
        */}
        {step === 4 && (
          <ListingWizard mode="create" onSaved={finish} />
        )}
      </div>

      {/* ProfileWizard owns Back while it is on screen, so only one is ever shown. */}
      {step > 1 && !ownsScreen && (
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={leaving}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral hover:text-[var(--fg)] disabled:opacity-50 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}
    </div>
  )
}
