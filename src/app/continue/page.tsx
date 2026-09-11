"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

// The single interstitial both waitlist emails land on:
//   • ?ct=…    the invite ("add your property") link — confirms the entry and
//              creates the passwordless account on the button press.
//   • ?token=… the sign-in link (resume / password-reset-free login) — exchanges
//              a one-time token for a session.
// Either way it ends in a session, then continues into onboarding.
//
// Nothing is spent on load, only on an explicit button press. Mail apps and
// corporate link scanners (Microsoft Safe Links, Proofpoint, Mimecast) fetch
// emailed links to vet them, and some run the page's JS. Acting on load let them
// confirm the entry or burn the single-use token before the person tapped, which
// surfaced on mobile as "this link has expired". A click is the one thing a
// scanner won't do.
function ContinueInner() {
  const sp = useSearchParams()
  const token = sp.get("token") // resume: a one-time login token
  const ct = sp.get("ct") // invite: a waitlist confirmation token
  const [state, setState] = useState<"idle" | "working" | "failed">("idle")

  // Already signed in (a re-click, or a second tab)? There's nothing to
  // exchange, so move straight on rather than trying to spend a spent token.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { getSession } = await import("next-auth/react")
      const session = await getSession()
      if (!cancelled && session?.user) window.location.assign("/onboarding")
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Exchange a one-time login token for a session. Shared by both flows.
  async function signInWithToken(loginToken: string) {
    const { signIn } = await import("next-auth/react")
    const res = await signIn("onetime", { token: loginToken, redirect: false })
    if (res?.ok && !res.error) {
      // Hard navigation: the session cookie has just changed.
      window.location.assign("/onboarding")
      return true
    }
    return false
  }

  async function proceed() {
    setState("working")
    try {
      if (ct) {
        // Invite flow: confirm the entry now (POST mutates; the GET that a
        // scanner might fire does not), then sign the new member in.
        const res = await fetch("/api/waitlist/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: ct }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setState("failed")
          return
        }
        if (data.status === "already-confirmed") {
          // Account already exists: send them to sign in, email prefilled.
          window.location.assign(
            `/login?email=${encodeURIComponent(data.email ?? "")}&notice=already-confirmed`,
          )
          return
        }
        if (data.status === "ready" && data.loginToken) {
          if (await signInWithToken(data.loginToken)) return
        }
        setState("failed")
        return
      }

      if (token) {
        if (await signInWithToken(token)) return
        setState("failed")
        return
      }

      setState("failed")
    } catch {
      setState("failed")
    }
  }

  const hasLink = Boolean(ct || token)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-wl-navy text-wl-ivory p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/waitlist/logo.png" alt="UnSwap" className="w-20 h-20 object-contain" />

      {state === "failed" || !hasLink ? (
        <>
          <h1 className="font-display text-[28px] text-wl-gold">Let&apos;s get you signed in</h1>
          <p className="text-wl-ivory-dim text-sm max-w-sm leading-relaxed">
            This link has already been used or has expired. They can be used once and last an
            hour. Enter your email on the sign-in page and we&apos;ll send a fresh one.
          </p>
          <div className="flex gap-3">
            <Link href="/waitlist" className="btn-outline px-6">Back to waitlist</Link>
            <Link href="/login" className="btn-gold px-6">Continue to sign in</Link>
          </div>
        </>
      ) : state === "working" ? (
        <>
          <svg className="animate-spin w-7 h-7 text-wl-gold" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-wl-ivory-dim text-sm">Signing you in…</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-[28px] text-wl-ivory">You&apos;re almost in</h1>
          <p className="text-wl-ivory-dim text-sm max-w-sm leading-relaxed">
            Tap below to sign in securely and finish setting up your account.
          </p>
          <button type="button" onClick={proceed} className="btn-gold px-8">
            Continue to UnSwap
          </button>
        </>
      )}
    </div>
  )
}

export default function ContinuePage() {
  return (
    <Suspense fallback={null}>
      <ContinueInner />
    </Suspense>
  )
}
