"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Mail, Eye, EyeOff, ArrowLeft, MailCheck } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { ThemeToggleIcon } from "@/components/theme/theme-toggle"

const inputCls =
  "w-full bg-[var(--field-bg)] border border-wl-border px-5 py-4 text-wl-ivory placeholder-wl-muted focus:outline-none focus:border-wl-gold focus:shadow-[0_0_0_1px_var(--border)] transition-all duration-300 text-[15px]"
const labelCls = "block text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1"

// Email-first login: ask for the email, then show the step that fits the
// account — password field, a one-time sign-in link (passwordless members who
// arrived from the waitlist but never set a password), or a nudge to register.
type Stage = "email" | "password" | "passwordless" | "none"

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()
  const [stage, setStage] = useState<Stage>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  const resetToEmail = () => {
    setStage("email")
    setPassword("")
    setLinkSent(false)
  }

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Something went wrong. Please try again.", "error")
        setLoading(false)
        return
      }
      setStage(data.state as Stage)
    } catch {
      toast("Something went wrong. Please try again.", "error")
    }
    setLoading(false)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn("credentials", {
        email,
        password,
        remember: remember ? "true" : "false",
        redirect: false,
      })
      if (res?.error) {
        toast("That password was not recognised. Please try again.", "error")
        setLoading(false)
      } else {
        const session = await getSession()
        const role = (session?.user as any)?.role
        router.push(role === "admin" ? "/overview" : "/dashboard")
        router.refresh()
      }
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  const handleSendLink = async () => {
    setLoading(true)
    try {
      await fetch("/api/auth/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
    } catch {
      /* neutral confirmation regardless */
    }
    setLinkSent(true)
    setLoading(false)
  }

  const EmailPill = (
    <button type="button" onClick={resetToEmail} className="inline-flex items-center gap-2 text-xs text-wl-muted hover:text-wl-gold transition-colors mb-6">
      <ArrowLeft size={13} />
      <span className="break-all">{email}</span>
      <span className="underline">change</span>
    </button>
  )

  return (
    <div className="min-h-screen w-full relative bg-wl-navy text-wl-ivory font-sans">
      {/* Theme switch */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggleIcon />
      </div>

      {/* IMAGE — faint backdrop on mobile, fixed left column on desktop */}
      <div className="absolute inset-0 lg:fixed lg:inset-y-0 lg:left-0 lg:w-[38%] overflow-hidden z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/auth-institution.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[rgba(10,14,26,0.6)]" />
        {/* lighten on mobile so the overlaid form stays readable */}
        <div className="absolute inset-0 bg-wl-navy/92 lg:hidden" />
        <div className="hidden lg:block absolute bottom-0 left-0 right-0 p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="w-[60px] h-px bg-wl-gold" />
            <p className="text-white/80 text-[11px] tracking-[0.22em] uppercase">Verified institutional access</p>
          </div>
        </div>
      </div>

      {/* FORM — scrolls with the page, offset past the fixed image column */}
      <div className="w-full lg:w-[62%] lg:ml-[38%] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative z-10 min-h-[100dvh]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--gold-dim)_0%,_transparent_60%)] pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative">
          <div className="flex justify-center mb-6">
            <Link href="/" aria-label="UnSwap — home" className="inline-flex transition-opacity hover:opacity-90">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/waitlist/logo.png" alt="UnSwap" className="w-24 h-24 object-contain" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-wl-border" />
            <span className="text-wl-ivory-dim text-[11px] tracking-[0.22em] uppercase font-medium">Welcome back</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-wl-border" />
          </div>

          <h1 className="font-display text-[32px] sm:text-[40px] font-light text-wl-ivory text-center leading-tight mb-2">
            Sign in to the network
          </h1>
          <p className="text-wl-ivory-dim text-center text-sm leading-relaxed mb-8">
            Manage your verifications, listings, and exchanges across UnSwap.
          </p>

          {/* ── STEP 1: email ── */}
          {stage === "email" && (
            <>
              <form onSubmit={handleEmailContinue} className="space-y-5">
                <div>
                  <label htmlFor="email" className={labelCls}>Work email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-wl-muted" />
                    </div>
                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organisation.int" className={`${inputCls} pr-11`} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-wl-gold hover:bg-wl-gold-light text-wl-navy text-sm font-medium tracking-[0.08em] uppercase py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(201,168,76,0.25)]">
                  {loading ? "Checking…" : "Continue"}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-wl-border text-center">
                <p className="text-sm text-wl-ivory-dim">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="font-semibold text-wl-gold hover:text-wl-gold-light transition-colors">Sign up</Link>
                </p>
              </div>
            </>
          )}

          {/* ── STEP 2a: password ── */}
          {stage === "password" && (
            <>
              {EmailPill}
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* Keep the email in the DOM so password managers associate it. */}
                <input type="hidden" name="email" value={email} autoComplete="username" />
                <div>
                  <div className="flex items-center justify-between mb-2 pl-1">
                    <label htmlFor="password" className="text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium">Password</label>
                    <Link href="/forgot-password" className="text-xs font-medium tracking-[0.06em] uppercase text-wl-gold hover:text-wl-gold-light transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative flex items-center">
                    <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputCls} pr-11`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 flex items-center text-wl-muted hover:text-wl-gold-light transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 border-wl-border accent-wl-gold" />
                  <span className="text-sm text-wl-ivory-dim">Keep me signed in</span>
                </label>

                <button type="submit" disabled={loading} className="w-full bg-wl-gold hover:bg-wl-gold-light text-wl-navy text-sm font-medium tracking-[0.08em] uppercase py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(201,168,76,0.25)]">
                  {loading ? "Signing in…" : "Log In"}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2b: passwordless → send a sign-in link ── */}
          {stage === "passwordless" && (
            <>
              {EmailPill}
              {linkSent ? (
                <div className="text-center">
                  <div className="mx-auto w-14 h-14 border border-wl-border text-wl-gold flex items-center justify-center mb-5">
                    <MailCheck size={24} strokeWidth={1.4} />
                  </div>
                  <div className="border-l-2 border-wl-gold bg-wl-gold-dim px-4 py-3.5 text-sm text-wl-ivory text-left">
                    We&apos;ve sent a one-time sign-in link to <span className="font-medium break-all">{email}</span>. It expires in an hour.
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-wl-ivory-dim text-sm leading-relaxed mb-6">
                    You joined from the waitlist but haven&apos;t set a password yet. We&apos;ll email you a secure,
                    one-time link to sign in and finish setting up your account.
                  </p>
                  <button type="button" onClick={handleSendLink} disabled={loading} className="w-full bg-wl-gold hover:bg-wl-gold-light text-wl-navy text-sm font-medium tracking-[0.08em] uppercase py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(201,168,76,0.25)]">
                    {loading ? "Sending…" : "Email me a sign-in link"}
                  </button>
                </>
              )}
            </>
          )}

          {/* ── STEP 2c: no account → register ── */}
          {stage === "none" && (
            <>
              {EmailPill}
              <p className="text-wl-ivory-dim text-sm leading-relaxed mb-6">
                We couldn&apos;t find an account for <span className="text-wl-ivory font-medium break-all">{email}</span>.
                Create one to join the network.
              </p>
              <Link href={`/register?email=${encodeURIComponent(email)}`} className="block w-full text-center bg-wl-gold hover:bg-wl-gold-light text-wl-navy text-sm font-medium tracking-[0.08em] uppercase py-4 transition-all duration-200 shadow-[0_4px_24px_rgba(201,168,76,0.25)]">
                Create an account
              </Link>
            </>
          )}

          <p className="mt-6 text-center text-[11px] text-wl-muted">
            UnSwap is an independent, staff-led platform, not affiliated with the United Nations.
          </p>
        </div>
      </div>
    </div>
  )
}
