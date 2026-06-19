"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MailCheck } from "lucide-react"
import { Logo } from "@/components/brand/logo"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Always confirms regardless of outcome (avoids account enumeration).
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Swallow — we show the same confirmation either way.
    }
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo underline wordClassName="text-[var(--navy)]" />
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-[var(--border)] p-8 sm:p-10">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--teal-light)] text-[var(--teal)] flex items-center justify-center mb-5">
                <MailCheck size={26} />
              </div>
              <h1 className="font-display text-2xl font-bold text-[var(--navy)]">
                Check your inbox
              </h1>
              <p className="mt-3 text-neutral leading-relaxed">
                If an account exists for{" "}
                <span className="font-semibold text-[var(--navy)]">{email}</span>,
                we&apos;ve sent instructions to reset your password.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-[var(--navy)]">
                Reset your password
              </h1>
              <p className="mt-2 text-neutral text-sm">
                Enter the work email linked to your account and we&apos;ll send a
                secure reset link.
              </p>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"
                  >
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organisation.int"
                    className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)] transition-colors"
            >
              <ArrowLeft size={15} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
