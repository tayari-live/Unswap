"use client"

/*
 * DORMANT — not mounted anywhere right now (removed from app/layout.tsx).
 * The app currently sets only the strictly-necessary NextAuth session cookie,
 * which needs no consent, so a banner here would imply a choice it doesn't honor.
 *
 * Re-mount this in app/layout.tsx (and gate the tracker script on the stored
 * choice via `localStorage.getItem("unswap-cookie-consent") === "accepted"`)
 * the moment you introduce ANY cookie-based analytics / marketing tag.
 * Prefer cookieless analytics (Plausible/Fathom) — then you can skip this entirely.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie } from "lucide-react"

const KEY = "unswap-cookie-consent"

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true)
    } catch {
      /* ignore */
    }
  }, [])

  function decide(value: "accepted" | "essential") {
    try {
      localStorage.setItem(KEY, value)
    } catch {
      /* ignore */
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-[60]">
      <div className="bg-[var(--navy)] text-white rounded-2xl shadow-xl border border-white/10 p-5">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-white/10 text-[var(--gold)] flex items-center justify-center flex-shrink-0">
            <Cookie size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold">We value your privacy</p>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              We use essential cookies to run UnSwap and, with your consent, a few more to improve it. See our{" "}
              <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => decide("accepted")}
            className="flex-1 text-sm font-semibold text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] rounded-xl py-2.5 transition-colors"
          >
            Accept all
          </button>
          <button
            onClick={() => decide("essential")}
            className="flex-1 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 rounded-xl py-2.5 transition-colors"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  )
}
