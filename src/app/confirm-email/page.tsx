"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MailCheck } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"

const RESEND_COOLDOWN = 45 // seconds between resends

function ConfirmEmailCard() {
  const sp = useSearchParams()
  const email = sp.get("email") ?? ""
  const fastTrack = sp.get("fast") === "1"

  // A link was just sent on arrival from the register flow, so the cooldown
  // starts immediately; it resets after each resend.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const resend = async () => {
    if (!email || cooldown > 0 || resending) return
    setResending(true)
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
    } catch {
      /* always show a neutral confirmation */
    }
    setResending(false)
    setCooldown(RESEND_COOLDOWN)
  }

  return (
    <AuthShell
      eyebrow="One more step"
      title="Verify your email"
      logoHref={null}
      footer={
        <p className="text-sm text-wl-ivory-dim">
          Wrong email address?{" "}
          <Link href="/register" className="text-wl-gold hover:text-wl-gold-light transition-colors">
            Sign up again
          </Link>
        </p>
      }
    >
      <div className="text-center">
        <div className="mx-auto w-16 h-16 border border-wl-border text-wl-gold flex items-center justify-center mb-6">
          <MailCheck size={26} strokeWidth={1.4} />
        </div>

        <div className="border-l-2 border-wl-gold bg-wl-gold-dim px-4 py-3.5 text-sm text-wl-ivory text-left">
          A verification link has been sent to{" "}
          <span className="font-medium break-all">{email || "your email address"}</span>
        </div>

        <p className="mt-4 text-sm text-wl-ivory-dim leading-relaxed">
          Check your inbox. The link expires in 24 hours.
          {fastTrack && " Your institutional email qualifies for fast-track verification."}
        </p>

        <div className="mt-7 text-left border border-wl-border p-5">
          <p className="text-[11px] tracking-[0.18em] uppercase font-medium text-wl-gold">
            Didn&apos;t receive it?
          </p>
          <p className="mt-2 text-sm text-wl-ivory-dim leading-relaxed">
            Check your spam folder and the spelling of your email before requesting another.
          </p>
          <button
            type="button"
            onClick={resend}
            disabled={!email || cooldown > 0 || resending}
            className="mt-3 text-[12px] tracking-[0.1em] uppercase font-medium text-wl-gold hover:text-wl-gold-light disabled:text-wl-muted disabled:cursor-not-allowed transition-colors"
          >
            {resending
              ? "Sending…"
              : cooldown > 0
              ? `Resend verification email (${cooldown})`
              : "Resend verification email"}
          </button>
        </div>
      </div>
    </AuthShell>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailCard />
    </Suspense>
  )
}
