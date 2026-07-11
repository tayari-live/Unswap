"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MailCheck } from "lucide-react"
import { Logo } from "@/components/brand/logo"

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
    <div className="w-full max-w-md bg-surface rounded-2xl border border-[var(--border)] shadow-xl p-8 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--gold)]/15 text-[var(--gold-dark)] flex items-center justify-center mb-5">
        <MailCheck size={26} />
      </div>
      <h1 className="font-display text-2xl font-bold text-[var(--navy)]">Verify your email address</h1>

      <div className="mt-5 rounded-xl bg-[var(--teal-light)] border border-[var(--teal)]/30 p-3.5 text-sm text-[var(--navy)]">
        A verification link has been sent to{" "}
        <span className="font-semibold break-all">{email || "your email address"}</span>
      </div>

      <p className="mt-4 text-sm text-neutral leading-relaxed">
        Check your inbox. The link in this email expires in 24 hours.
        {fastTrack && " Your institutional email qualifies for fast-track verification."}
      </p>

      <div className="mt-6 text-left rounded-xl bg-[var(--background)] border border-[var(--border)] p-4">
        <p className="text-sm font-semibold text-[var(--navy)]">Didn&apos;t receive an email?</p>
        <p className="mt-1 text-sm text-neutral leading-relaxed">
          Check your spam folder and the spelling of your email before requesting
          another verification email.
        </p>
        <button
          type="button"
          onClick={resend}
          disabled={!email || cooldown > 0 || resending}
          className="mt-3 text-sm font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)] underline disabled:no-underline disabled:text-neutral disabled:cursor-not-allowed"
        >
          {resending
            ? "Sending…"
            : cooldown > 0
            ? `Resend verification email (${cooldown})`
            : "Resend verification email"}
        </button>
      </div>

      <p className="mt-5 text-sm text-neutral">
        Wrong email address?{" "}
        <Link href="/register" className="font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)] underline">
          Sign up again
        </Link>
      </p>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen bg-[var(--parchment)] flex flex-col">
      <div className="p-6">
        <Link href="/">
          <Logo underline wordClassName="text-[var(--navy)]" />
        </Link>
      </div>
      <div className="flex-1 flex items-start sm:items-center justify-center p-6 pb-16">
        <Suspense fallback={null}>
          <ConfirmEmailCard />
        </Suspense>
      </div>
    </div>
  )
}
