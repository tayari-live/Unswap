"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MailCheck } from "lucide-react"
import { AuthShell, authInputCls, authLabelCls, authBtnCls } from "@/components/auth/auth-shell"

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
    setLoading(false)
  }

  const backToSignIn = (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.1em] uppercase font-medium text-wl-gold hover:text-wl-gold-light transition-colors"
    >
      <ArrowLeft size={14} />
      Back to sign in
    </Link>
  )

  if (submitted) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Instructions sent"
        footer={backToSignIn}
      >
        <div className="text-center">
          <div className="mx-auto w-16 h-16 border border-wl-border text-wl-gold flex items-center justify-center mb-6">
            <MailCheck size={26} strokeWidth={1.4} />
          </div>
          <p className="text-wl-ivory-dim leading-relaxed">
            If an account exists for{" "}
            <span className="text-wl-ivory font-medium">{email}</span>, we have sent
            instructions to reset your password.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email linked to your account and we will send a secure reset link."
      footer={backToSignIn}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className={authLabelCls}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="j.doe@un.org"
            className={authInputCls}
          />
        </div>

        <button type="submit" disabled={loading} className={`${authBtnCls} mt-2`}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  )
}
