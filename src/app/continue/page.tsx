"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

// Lands here from the waitlist invite link. The confirm route created a
// passwordless account and a one-time sign-in token; we exchange it for a
// session, then continue into onboarding. No password is set yet.
function ContinueInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const token = sp.get("token")
    if (!token) {
      setFailed(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        // Imported lazily so this route stays a light client bundle.
        const { signIn } = await import("next-auth/react")
        const res = await signIn("onetime", { token, redirect: false })
        if (cancelled) return
        if (res?.ok && !res.error) {
          // Hard navigation: the session cookie has just changed.
          window.location.assign("/onboarding")
        } else {
          setFailed(true)
        }
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sp, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-wl-navy text-wl-ivory p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/waitlist/logo.png" alt="UnSwap" className="w-20 h-20 object-contain" />
      {failed ? (
        <>
          <h1 className="font-display text-[28px] text-wl-gold">This link has expired</h1>
          <p className="text-wl-ivory-dim text-sm max-w-sm leading-relaxed">
            Sign-in links can only be used once and expire after an hour. Request a fresh one
            from the waitlist page, or log in if you have already set a password.
          </p>
          <div className="flex gap-3">
            <Link href="/waitlist" className="btn-outline px-6">Back to waitlist</Link>
            <Link href="/login" className="btn-gold px-6">Log in</Link>
          </div>
        </>
      ) : (
        <>
          <svg className="animate-spin w-7 h-7 text-wl-gold" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-wl-ivory-dim text-sm">Signing you in…</p>
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
