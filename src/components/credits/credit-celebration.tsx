"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import confetti from "canvas-confetti"
import { Coins, X } from "lucide-react"

type Grant = { id: string; amount: number; title: string; reason: string }

const GOLD = ["#c9a84c", "#e4c97a", "#f5f0e8"]

// A short, celebratory burst — two side cannons so it reads as a moment, not a
// notification. Respects prefers-reduced-motion.
//
// zIndex must clear the modal layer (400): canvas-confetti mounts its canvas at
// z-index 100 by default, which puts the particles *behind* the backdrop, where
// the dim and blur swallow them.
function burst() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
  const opts = {
    particleCount: 70,
    spread: 68,
    colors: GOLD,
    zIndex: 450,
    disableForReducedMotion: true,
  }
  // Fired from the lower corners so the arcs cross the open space beside the
  // card rather than launching from behind it.
  confetti({ ...opts, origin: { x: 0.1, y: 0.85 }, angle: 60 })
  confetti({ ...opts, origin: { x: 0.9, y: 0.85 }, angle: 120 })
  setTimeout(() => confetti({ ...opts, particleCount: 50, spread: 100, origin: { y: 0.75 } }), 220)
}

/**
 * Congratulates a member the first time they earn free credits (welcome bonus,
 * first listing, identity verified, first subscription). Polls once per route
 * change rather than on a timer, so it costs nothing while idle.
 */
export function CreditCelebration() {
  const pathname = usePathname()
  const [grants, setGrants] = useState<Grant[]>([])
  const [open, setOpen] = useState(false)
  // Grants already celebrated in this tab. Clicking "View my credits" navigates
  // immediately, so the next route's check can otherwise outrun the POST below
  // and show the same grants a second time.
  const dismissed = useRef<Set<string>>(new Set())
  const marking = useRef<Promise<unknown> | null>(null)

  useEffect(() => {
    let cancelled = false
    // Don't interrupt the onboarding wizard.
    if (pathname?.startsWith("/onboarding")) return
    ;(async () => {
      try {
        // Let any in-flight "mark celebrated" settle first.
        if (marking.current) await marking.current
        if (cancelled) return
        const res = await fetch("/api/credits/celebrate", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data.grants?.length) return
        const fresh = (data.grants as Grant[]).filter((g) => !dismissed.current.has(g.id))
        if (!fresh.length) return
        setGrants(fresh)
        setOpen(true)
        setTimeout(burst, 250)
      } catch {
        /* silent — a celebration is never worth an error */
      }
    })()
    return () => { cancelled = true }
  }, [pathname])

  const dismiss = useCallback(async () => {
    setOpen(false)
    // Record synchronously, before any await, so a navigation triggered by the
    // same click cannot re-show these grants.
    grants.forEach((g) => dismissed.current.add(g.id))
    const done = fetch("/api/credits/celebrate", { method: "POST" }).catch(() => {
      /* if this fails the member simply sees it again on a later visit */
    })
    marking.current = done
    await done
  }, [grants])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, dismiss])

  if (!open || !grants.length) return null

  const total = grants.reduce((sum, g) => sum + g.amount, 0)
  const multiple = grants.length > 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="credit-celebration-title"
      className="fixed inset-0 z-modal flex items-center justify-center p-6 bg-[rgba(10,14,26,0.72)] backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--gold)] rounded-md p-9 text-center shadow-[0_24px_80px_rgba(10,14,26,0.45)]"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-neutral hover:text-[var(--fg)] transition-colors"
        >
          <X size={17} />
        </button>

        <div className="mx-auto w-16 h-16 border border-[var(--gold)] text-[var(--gold)] flex items-center justify-center mb-6">
          <Coins size={28} strokeWidth={1.4} />
        </div>

        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-[var(--gold-soft)]/50" />
          <span className="text-[11px] tracking-[0.28em] uppercase font-medium text-[var(--gold-soft)]">
            Credits Earned
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-[var(--gold-soft)]/50" />
        </div>

        <h2 id="credit-celebration-title" className="font-sans font-semibold text-[2.5rem] leading-none text-[var(--fg)]">
          +{total} <span className="text-[var(--gold)]">{total === 1 ? "credit" : "credits"}</span>
        </h2>

        <p className="mt-4 text-sm text-neutral leading-relaxed">
          {multiple
            ? "Nicely done. You have unlocked several rewards:"
            : "Nicely done. One credit is one night in a fellow member's home."}
        </p>

        <ul className="mt-5 space-y-2 text-left">
          {grants.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between gap-3 border border-[var(--hair)] rounded-sm px-4 py-2.5"
            >
              <span className="text-sm text-[var(--fg)]">{g.title}</span>
              <span className="font-sans font-semibold text-xl text-[var(--gold)] tabular-nums">+{g.amount}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/credits"
            onClick={dismiss}
            className="inline-flex justify-center items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-ink bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-6 py-3 rounded-sm transition-colors"
          >
            View my credits
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex justify-center items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--fg)] border border-[var(--hair)] hover:border-[var(--gold)] px-6 py-3 rounded-sm transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
