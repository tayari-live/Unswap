"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Info, ShieldCheck, MailCheck } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { useToast } from "@/components/ui/toast"

// Institutional domains that qualify for fast-track verification. Mirrors the
// admin-editable allowlist; kept here for instant client-side feedback only —
// the server remains the source of truth at submission.
const FAST_TRACK_DOMAINS = [
  "un.org", "undp.org", "unicef.org", "who.int", "unhcr.org",
  "imf.org", "worldbank.org", "ilo.org", "fao.org", "wfp.org",
  "unaids.org", "unep.org", "unfpa.org", "habitat.un.org", "ocha.un.org",
]

function domainStatus(email: string): "fast" | "manual" | null {
  const at = email.indexOf("@")
  if (at < 0 || at === email.length - 1) return null
  const domain = email.slice(at + 1).toLowerCase().trim()
  if (!domain.includes(".")) return null
  return FAST_TRACK_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))
    ? "fast"
    : "manual"
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ fastTrack: boolean; emailSent: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState<"idle" | "sending" | "sent">("idle")
  const toast = useToast()

  const status = domainStatus(email)

  const handleResend = async () => {
    setResent("sending")
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
    } catch {
      /* ignore — we always show a neutral confirmation */
    }
    setResent("sent")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not create your account.", "error")
        setLoading(false)
        return
      }
      setResult(data)
      setSubmitted(true)
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/auth-institution.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#fdfbf7]/80 backdrop-blur-[2px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 sm:p-10 border border-[var(--border)]">
        <div className="flex justify-center mb-8">
          <Logo wordClassName="text-[var(--navy)]" />
        </div>

        {submitted ? (
          <div>
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--teal-light)] text-[var(--teal)] flex items-center justify-center mb-5">
                <MailCheck size={26} />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--navy)]">
                {result?.emailSent === false ? "Account created" : "Check your inbox"}
              </h2>
              <p className="mt-3 text-sm text-neutral/80 leading-relaxed">
                {result?.emailSent === false ? (
                  <>
                    Welcome, {firstName || "there"}. We&apos;ll email your verification
                    link to{" "}
                    <span className="font-semibold text-[var(--navy)]">{email}</span>{" "}
                    shortly. Here&apos;s what happens next:
                  </>
                ) : (
                  <>
                    We&apos;ve sent a verification link to{" "}
                    <span className="font-semibold text-[var(--navy)]">{email}</span>.
                    Here&apos;s what happens next:
                  </>
                )}
              </p>
            </div>

            {/* What happens next — the verification journey */}
            <ol className="mt-7 space-y-4">
              {[
                {
                  n: 1,
                  title: "Verify your email",
                  body: `Open the link we sent to ${email}. It expires in 24 hours.`,
                  current: true,
                },
                {
                  n: 2,
                  title: "Complete identity verification",
                  body: result?.fastTrack
                    ? "Upload your staff ID — recognised institutional emails are fast-tracked."
                    : "Upload your staff ID and proof of employment for our team to review.",
                },
                {
                  n: 3,
                  title: "Get approved & explore",
                  body: "Once you're verified, browse homes worldwide, list your own, and request your first swap.",
                },
              ].map((s) => (
                <li key={s.n} className="flex gap-3.5">
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      s.current
                        ? "bg-[var(--gold-dark)] text-white"
                        : "bg-[var(--border)] text-neutral-dark"
                    }`}
                  >
                    {s.n}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--navy)]">
                      {s.title}
                      {s.current && (
                        <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide text-[var(--gold-dark)]">
                          You&apos;re here
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href="/login"
              className="mt-8 w-full inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-bold text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] transition-colors"
            >
              Go to sign in
            </Link>
            <p className="mt-4 text-center text-xs text-neutral">
              Didn&apos;t get the email? Check your spam folder, or{" "}
              {resent === "sent" ? (
                <span className="font-semibold text-[var(--teal)]">link re-sent ✓</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resent === "sending"}
                  className="font-bold text-[var(--teal)] hover:text-[var(--teal-dark)] underline disabled:opacity-50"
                >
                  {resent === "sending" ? "resending…" : "resend it"}
                </button>
              )}
              .
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-[var(--navy)]">
              Sign up
            </h2>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs font-semibold text-[var(--navy)] mb-1.5"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="block w-full px-4 py-3 border border-neutral/30 rounded-xl bg-white placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-[var(--teal)]/30 focus:border-[var(--teal)] text-sm text-[var(--navy)] transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs font-semibold text-[var(--navy)] mb-1.5"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="block w-full px-4 py-3 border border-neutral/30 rounded-xl bg-white placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-[var(--teal)]/30 focus:border-[var(--teal)] text-sm text-[var(--navy)] transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-[var(--navy)] mb-1.5"
                >
                  Work Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@un.org"
                  className="block w-full px-4 py-3 border border-neutral/30 rounded-xl bg-white placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-[var(--teal)]/30 focus:border-[var(--teal)] text-sm text-[var(--navy)] transition-all shadow-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[var(--navy)] mb-1.5"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="block w-full pl-4 pr-11 py-3 border border-neutral/30 rounded-xl bg-white placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-[var(--teal)]/30 focus:border-[var(--teal)] text-sm text-[var(--navy)] transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 flex items-center text-neutral hover:text-[var(--navy)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Eligibility hint reacts to the email domain */}
              <div
                className={`flex gap-2.5 p-3 rounded-xl text-xs border ${
                  status === "fast"
                    ? "bg-[var(--teal-light)] border-[var(--teal)]/30 text-[var(--teal)]"
                    : "bg-[#fdfbf7] border-[var(--gold)]/30 text-[var(--gold-dark)]"
                }`}
              >
                {status === "fast" ? (
                  <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <Info size={16} className="flex-shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">
                  {status === "fast"
                    ? "Recognised institutional email — you qualify for fast-track verification."
                    : "Use your institutional email (@un.org, @undp.org, etc.) for fast-track verification. Other addresses enter manual review."}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                {loading ? "Creating account…" : "Sign up"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
              <p className="text-sm text-neutral">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors underline decoration-2 underline-offset-4"
                >
                  Log in
                </Link>
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-neutral/70 text-center leading-tight">
              UnSwap is an independent, staff-led platform, not affiliated with the United Nations.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
