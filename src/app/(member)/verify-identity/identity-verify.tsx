"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ScanFace, ArrowRight, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"

/**
 * Automated ID verification (Stripe Identity). One tap starts a hosted flow
 * where the member scans a government ID and takes a selfie; Stripe verifies it
 * and reports back via webhook, which flips the member to fully verified. The
 * document is handled by the provider — UnSwap never stores it.
 */
export function IdentityVerify() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [returned, setReturned] = useState(false)

  // Coming back from the Stripe-hosted flow (?idv=complete): the result arrives
  // by webhook a moment later, so show a processing state and refresh.
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("idv") === "complete") {
        setReturned(true)
        const t = setTimeout(() => router.refresh(), 6000)
        return () => clearTimeout(t)
      }
    } catch {
      /* ignore */
    }
  }, [router])

  const start = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/verification/identity", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast(data.error || "Could not start ID verification.", "error")
        setLoading(false)
        return
      }
      window.location.href = data.url // Stripe-hosted verification flow
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  if (returned) {
    return (
      <div className="bg-[var(--teal-light)] border border-[var(--teal)]/30 rounded-md p-6 flex items-start gap-3">
        <Loader2 size={20} className="text-[var(--teal)] flex-shrink-0 mt-0.5 animate-spin" />
        <div>
          <p className="text-sm font-semibold text-[var(--fg)]">Checking your ID…</p>
          <p className="mt-1 text-sm text-neutral-dark leading-relaxed">
            This usually takes under a minute. This page will refresh automatically —
            you&apos;ll be fully verified as soon as it clears.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-md border border-[var(--gold)]/40 p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-[var(--gold)]/12 text-[var(--gold-dark)] flex items-center justify-center flex-shrink-0">
          <ScanFace size={20} />
        </div>
        <div>
          <h2 className="font-sans text-lg font-semibold text-[var(--fg)]">Verify your ID instantly</h2>
          <p className="mt-1 text-sm text-neutral-dark leading-relaxed">
            Scan a government ID and take a quick selfie — verified automatically in under a
            minute, no waiting for a reviewer. Your document is handled by our verification
            partner and never stored by UnSwap.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Starting…" : <>Verify with ID <ArrowRight size={16} /></>}
      </button>
    </div>
  )
}
