"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import confetti from "canvas-confetti"
import { BadgeCheck, Search, Home, Coins, X } from "lucide-react"

type Pending = { firstName: string; credits: number }

const GOLD = ["#c9a84c", "#e4c97a", "#f5f0e8"]

/**
 * A longer, slower burst than the credit one. This is the moment the network
 * actually opens to them, so it should feel like arrival rather than a
 * notification. zIndex clears the dialog: canvas-confetti mounts its canvas at
 * 100 by default, which would put the particles behind the backdrop.
 */
function celebrate() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
  const base = { colors: GOLD, zIndex: 450, disableForReducedMotion: true }
  const end = Date.now() + 1400
  ;(function frame() {
    confetti({ ...base, particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } })
    confetti({ ...base, particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
  setTimeout(() => confetti({ ...base, particleCount: 90, spread: 110, origin: { y: 0.62 } }), 260)
}

const UNLOCKED = [
  { icon: Search, label: "Browse every verified home" },
  { icon: Home, label: "Publish your own listing" },
  { icon: BadgeCheck, label: "Request and accept exchanges" },
]

/**
 * Congratulates a member the first time they reach full verification.
 *
 * Verification is the emotional peak of joining a closed network — until now it
 * arrived as a silent status change. Checked once per route change rather than
 * on a timer, so it costs nothing while idle.
 */
export function VerificationCelebration() {
  const pathname = usePathname()
  const [pending, setPending] = useState<Pending | null>(null)
  const [open, setOpen] = useState(false)
  // Set synchronously on dismiss so a navigation triggered by the same click
  // cannot re-show it before the POST lands.
  const done = useRef(false)
  const marking = useRef<Promise<unknown> | null>(null)

  useEffect(() => {
    let cancelled = false
    if (pathname?.startsWith("/onboarding") || done.current) return
    ;(async () => {
      try {
        if (marking.current) await marking.current
        if (cancelled || done.current) return
        const res = await fetch("/api/verification/celebrate", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data.pending) return
        setPending(data.pending)
        setOpen(true)
        setTimeout(celebrate, 260)
      } catch {
        /* silent — a celebration is never worth an error */
      }
    })()
    return () => { cancelled = true }
  }, [pathname])

  const dismiss = useCallback(async () => {
    setOpen(false)
    done.current = true
    const p = fetch("/api/verification/celebrate", { method: "POST" }).catch(() => {
      /* if this fails the member simply sees it again on a later visit */
    })
    marking.current = p
    await p
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, dismiss])

  if (!open || !pending) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verified-celebration-title"
      className="fixed inset-0 z-modal flex items-center justify-center p-6 bg-[rgba(10,14,26,0.78)] backdrop-blur-sm animate-[fadeIn_0.25s_ease-out]"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--gold)] rounded-md p-10 text-center shadow-[0_24px_80px_rgba(10,14,26,0.5)]"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-neutral hover:text-[var(--fg)] transition-colors"
        >
          <X size={17} />
        </button>

        <div className="mx-auto w-20 h-20 border border-[var(--gold)] text-[var(--gold)] flex items-center justify-center mb-7">
          <BadgeCheck size={36} strokeWidth={1.2} />
        </div>

        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--gold-soft)]/50" />
          <span className="text-[11px] tracking-[0.28em] uppercase font-medium text-[var(--gold-soft)]">
            Verification Complete
          </span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--gold-soft)]/50" />
        </div>

        <h2
          id="verified-celebration-title"
          className="font-sans font-semibold text-[2.75rem] leading-[1.05] text-[var(--fg)]"
        >
          Welcome to the network,
          <br />
          <span className="text-[var(--gold)] italic">{pending.firstName}</span>
        </h2>

        <p className="mt-5 text-[15px] text-neutral leading-[1.7] max-w-sm mx-auto">
          Your professional status is verified. Every member you meet here has passed
          the same check, and has as much to protect as you do.
        </p>

        <ul className="mt-8 space-y-px bg-[var(--hair)] border border-[var(--hair)] text-left">
          {UNLOCKED.map((u) => (
            <li key={u.label} className="flex items-center gap-3.5 bg-[var(--surface)] px-5 py-3.5">
              <u.icon size={17} strokeWidth={1.5} className="text-[var(--gold-soft)] flex-shrink-0" />
              <span className="text-sm text-[var(--fg)]">{u.label}</span>
            </li>
          ))}
        </ul>

        {pending.credits > 0 && (
          <div className="mt-5 flex items-center justify-center gap-2.5 text-sm text-neutral">
            <Coins size={16} strokeWidth={1.5} className="text-[var(--gold)]" />
            <span>
              <span className="font-sans text-lg font-light text-[var(--gold)]">+{pending.credits}</span>{" "}
              credit{pending.credits === 1 ? "" : "s"} added to get you started
            </span>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/browse"
            onClick={dismiss}
            className="inline-flex justify-center items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#0a0e1a] bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-7 py-3.5 rounded-sm transition-colors"
          >
            Explore homes
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex justify-center items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--fg)] border border-[var(--hair)] hover:border-[var(--gold)] px-7 py-3.5 rounded-sm transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
