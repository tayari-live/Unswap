"use client"

import { useState } from "react"
import Link from "next/link"
import { AuthShell } from "@/components/auth/auth-shell"

const inputCls =
  "w-full bg-[var(--field-bg)] border border-wl-border px-5 py-4 text-wl-ivory placeholder-wl-muted focus:outline-none focus:border-wl-gold focus:shadow-[0_0_0_1px_rgba(201,168,76,0.35)] transition-all duration-300 text-[15px]"

// For members who arrived from the waitlist invite but never set a password:
// their invite link is single-use, so this issues a fresh one-time sign-in link.
export default function ResumePage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || !email) return
    setSubmitting(true)
    try {
      await fetch("/api/auth/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
    } catch {
      /* always show the same neutral confirmation */
    }
    setSent(true)
    setSubmitting(false)
  }

  return (
    <AuthShell
      eyebrow="Finish setting up"
      title="Get a sign-in link"
      logoHref="/login"
      footer={
        <p className="text-sm text-wl-ivory-dim">
          Already set a password?{" "}
          <Link href="/login" className="font-semibold text-wl-gold hover:text-wl-gold-light transition-colors">Log in</Link>
        </p>
      }
    >
      {sent ? (
        <div className="border-l-2 border-wl-gold bg-wl-gold-dim px-4 py-3.5 text-sm text-wl-ivory">
          If <span className="font-medium break-all">{email}</span> has an account still being set up, we&apos;ve sent a
          one-time sign-in link to that address. It expires in an hour.
        </div>
      ) : (
        <>
          <p className="text-wl-ivory-dim text-sm leading-relaxed mb-6">
            Joined from the waitlist and haven&apos;t set a password yet? Enter your email and we&apos;ll send a
            secure link to pick up where you left off.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="resume-email" className="block text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1">
                Email address
              </label>
              <input id="resume-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className={inputCls} />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-wl-gold hover:bg-wl-gold-light text-wl-navy text-sm font-medium tracking-[0.08em] uppercase py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(201,168,76,0.25)]">
              {submitting ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
