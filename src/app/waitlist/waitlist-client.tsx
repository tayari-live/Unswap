"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { ThemeToggleIcon } from "@/components/theme/theme-toggle"

const ORGS = [
  "United Nations",
  "Specialized Agencies (WHO, ILO, UNESCO, etc.)",
  "World Bank Group",
  "International Monetary Fund (IMF)",
  "Diplomatic Mission / Foreign Service",
  "Other Intergovernmental Organization",
  "I am a friend/family of an international employee whom I want to invite",
]

const inputCls =
  "w-full bg-[var(--field-bg)] border border-wl-border px-[20px] py-[16px] text-wl-ivory placeholder-wl-muted focus:outline-none focus:border-wl-gold focus:shadow-[0_0_0_1px_var(--border)] transition-all duration-300 text-[15px]"

type CountData = { count: number; recentJoiners: { initials: string }[] }
// The API answers identically for a new address and one already on the list,
// so this page cannot tell them apart — which is the point.
type Initiated = { status: "pending"; email: string; confirmUrl?: string }

export function WaitlistClient() {
  const [mode, setMode] = useState<"join" | "status" | "success" | "error">("join")

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [organization, setOrganization] = useState("")
  const [checkEmail, setCheckEmail] = useState("")
  const [statusLinkSent, setStatusLinkSent] = useState(false)

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)
  const [recentJoiners, setRecentJoiners] = useState<{ initials: string }[]>([])
  const [devConfirmUrl, setDevConfirmUrl] = useState<string | undefined>()

  // Confetti burst + reduce to the "check inbox" state on success.
  useEffect(() => {
    if (mode === "success") {
      setTimeout(
        () => confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ["#C9A84C", "#F5F0E8", "#0A0E1A"] }),
        350,
      )
    }
  }, [mode])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    const errParam = params.get("error")
    if (ref) sessionStorage.setItem("unswap_referral_code", ref)
    if (errParam) {
      setErrorMessage(decodeURIComponent(errParam).replace(/\+/g, " "))
      setMode("error")
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    fetch("/api/waitlist/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CountData | null) => {
        if (d && typeof d.count === "number") setWaitlistCount(d.count)
        if (d && Array.isArray(d.recentJoiners)) setRecentJoiners(d.recentJoiners)
      })
      .catch(() => setWaitlistCount(0))
  }, [])

  async function handleInitiateJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !name) return
    setStatus("loading")
    setErrorMessage("")
    const ref = sessionStorage.getItem("unswap_referral_code") || undefined
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, organization, ref }),
      })
      const data = (await res.json()) as Initiated & { error?: string }
      if (!res.ok) throw new Error(data.error || "Failed to initiate signup")
      setDevConfirmUrl(data.confirmUrl)
      setMode("success")
      setStatus("idle")
    } catch (err) {
      setErrorMessage((err as Error).message || "Failed to initiate signup")
      setMode("error")
      setStatus("error")
    }
  }

  /**
   * Ask for the place to be emailed. The reply is the same whether or not the
   * address is on the list, so this page never reveals who is a member — the
   * link goes to the inbox instead.
   */
  async function handleCheckStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!checkEmail) return
    setStatus("loading")
    setErrorMessage("")
    try {
      const res = await fetch("/api/waitlist/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: checkEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Something went wrong.")
      setStatusLinkSent(true)
      setStatus("idle")
    } catch (err) {
      setErrorMessage((err as Error).message || "Something went wrong.")
      setStatus("error")
    }
  }

  // Prefilled direct-signup link (bypasses the queue; hands name/email to /register).
  const signupParams = new URLSearchParams()
  if (email) signupParams.set("email", email)
  if (name) signupParams.set("name", name)
  const signupHref = `/register${signupParams.toString() ? `?${signupParams.toString()}` : ""}`

  return (
    <div className="min-h-screen bg-wl-navy text-wl-ivory relative">
      {/* Theme switch — floats above every mode of the page */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggleIcon />
      </div>

      <AnimatePresence mode="wait">
        {/* ── JOIN ── */}
        {mode === "join" && (
          <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-h-screen relative">
            {/* FORM — scrolls with the page, offset past the fixed image column */}
            <div className="w-full lg:w-[65%] lg:ml-[35%] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative z-10 min-h-[100dvh]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--gold-dim)_0%,_transparent_60%)] pointer-events-none" />
              <div className="w-full max-w-xl mx-auto relative">
                <div className="flex justify-center mb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/waitlist/logo.png" alt="UnSwap" className="w-28 h-28 object-contain" />
                </div>
                <div className="flex items-center justify-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-wl-border" />
                  <span className="text-wl-ivory text-[11px] tracking-[0.22em] uppercase font-medium">Exclusive Access</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-wl-border" />
                </div>
                <p className="text-wl-gold font-display text-[26px] leading-snug text-center mb-10 font-light italic">
                  A closed-loop home exchange ecosystem exclusively for verified staff of the UN, World Bank, IMF and other International Organizations.
                </p>

                <form onSubmit={handleInitiateJoin} className="space-y-4">
                  <div>
                    <label htmlFor="wl-name" className="text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1 flex items-center gap-1">
                      Full Name <span className="text-wl-gold">*</span>
                    </label>
                    <input id="wl-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="wl-email" className="text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1 flex items-center gap-1">
                      Email Address <span className="text-wl-gold">*</span>
                    </label>
                    <input id="wl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="wl-org" className="text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1 flex items-center gap-1">
                      Organization / Affiliation <span className="text-wl-gold">*</span>
                    </label>
                    <select
                      id="wl-org"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      required
                      className={`w-full bg-[var(--field-bg)] border border-wl-border px-[20px] py-[16px] focus:outline-none focus:border-wl-gold focus:shadow-[0_0_0_1px_var(--border)] hover:border-wl-gold transition-all duration-300 appearance-none text-[15px] ${!organization ? "text-wl-muted" : "text-wl-ivory"}`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23c9a84c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1.5rem 1.5rem" }}
                    >
                      <option value="" disabled className="bg-wl-navy text-wl-muted">Select your organization / affiliation</option>
                      {ORGS.map((org) => (
                        <option key={org} value={org} className="bg-wl-navy text-wl-ivory">{org}</option>
                      ))}
                    </select>
                  </div>

                  {errorMessage && <p className="text-[#ff6b6b] text-[14.5px]">{errorMessage}</p>}

                  <button type="submit" disabled={status === "loading"} className="btn-gold w-full flex items-center justify-center mt-2 group shadow-[0_4px_24px_var(--gold-dim)]">
                    {status === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                        Processing...
                      </span>
                    ) : "Request Access →"}
                  </button>

                  <div className="pt-6 mt-4 border-t border-wl-border flex flex-col items-center gap-3">
                    {waitlistCount === 0 ? (
                      <p className="text-[13px] text-wl-ivory-dim">Be the first to join!</p>
                    ) : waitlistCount !== null && (
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {recentJoiners.slice(0, 3).map((j, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-[rgba(201,168,76,0.15)] border border-wl-border flex items-center justify-center text-[10px] font-medium text-wl-gold shadow-sm z-10">{j.initials}</div>
                          ))}
                          {waitlistCount > 3 && (
                            <div className="w-8 h-8 z-0 rounded-full bg-[rgba(10,14,26,0.5)] border border-wl-border flex items-center justify-center text-[10px] font-medium text-wl-ivory-dim">+{waitlistCount - 3}</div>
                          )}
                        </div>
                        <span className="text-[13px] text-wl-ivory-dim"><span className="text-wl-ivory font-medium">{waitlistCount}</span> members already on the list</span>
                      </div>
                    )}
                    <button type="button" onClick={() => { setMode("status"); setErrorMessage("") }} className="text-wl-muted hover:text-wl-gold text-[11px] font-medium tracking-[0.18em] uppercase transition-colors">
                      Check Status →
                    </button>
                  </div>
                </form>

                {/* Prefer not to wait — book a call or sign up directly (bypass the queue) */}
                <div className="mt-6 pt-6 border-t border-wl-border text-center">
                  <p className="text-[12px] text-wl-ivory-dim mb-3">Prefer not to wait?</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a href="/book" className="btn-outline flex-1 text-center">Book a call</a>
                    <a href={signupHref} className="btn-gold flex-1 text-center">Sign up now →</a>
                  </div>
                </div>
              </div>
            </div>

            {/* IMAGE — a faint backdrop on mobile, a fixed column on desktop */}
            <div className="absolute inset-0 lg:fixed lg:inset-y-0 lg:left-0 lg:w-[35%] overflow-hidden z-0 bg-wl-deep lg:border-r lg:border-wl-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/waitlist/interior.png" alt="Luxury Interior" className="absolute inset-0 w-full h-full object-cover object-center opacity-80" />
              <div className="absolute inset-0 bg-wl-navy/90 lg:hidden" />
              <div className="hidden lg:block absolute bottom-0 left-0 right-0 p-8 lg:p-10">
                <div className="flex items-center gap-3">
                  <div className="w-[60px] h-px bg-wl-gold" />
                  <p className="text-wl-gold/60 text-[11px] tracking-[0.22em] uppercase">By invitation only</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SUCCESS (check inbox) ── */}
        {mode === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full relative min-h-screen py-10 px-6">
            <button onClick={() => { setMode("join"); setEmail(""); setName(""); setOrganization("") }} className="absolute top-8 left-4 sm:left-8 text-wl-ivory-dim hover:text-wl-ivory transition-colors flex items-center gap-2 text-[14.5px]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
            <div className="w-16 h-16 rounded-full bg-[rgba(201,168,76,0.05)] border border-wl-border flex items-center justify-center mb-6 mt-2 shadow-[0_4px_24px_var(--gold-dim)]">
              <svg className="w-8 h-8 text-wl-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            </div>
            <h2 className="font-display text-[44px] sm:text-[56px] font-normal text-wl-gold mb-4 leading-[1.15]">Check your inbox</h2>
            <p className="text-wl-ivory-dim text-[16px] mb-1">We sent a confirmation link to</p>
            <p className="text-wl-ivory font-medium text-[16px] mb-3">{email}</p>
            <p className="text-wl-muted text-[14.5px] max-w-xs mx-auto leading-relaxed mb-4">Click the link to confirm your email and be redirected to your waitlist status dashboard.</p>
            <div className="bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.15)] rounded-lg p-3 max-w-sm mx-auto">
              <p className="text-[13px] text-wl-ivory-dim"><span className="text-wl-gold font-medium mr-1">Note:</span> It may take up to a minute for the message to arrive. Please check your spam folder if you don&apos;t see it.</p>
            </div>
            {devConfirmUrl && (
              <a href={devConfirmUrl} className="mt-5 text-[13px] font-medium text-wl-gold hover:text-wl-gold-light underline">Dev: confirm now →</a>
            )}
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {mode === "error" && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center max-w-md mx-auto w-full relative min-h-screen p-6">
            <button onClick={() => { setMode("join"); setEmail(""); setName(""); setOrganization(""); setErrorMessage("") }} className="absolute top-8 left-4 sm:left-8 text-wl-ivory-dim hover:text-wl-ivory transition-colors flex items-center gap-2 text-[14.5px]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
            <div className="w-16 h-16 rounded-full bg-[rgba(255,0,0,0.03)] border border-[rgba(255,0,0,0.15)] flex items-center justify-center mb-6 mt-2">
              <svg className="w-8 h-8 text-[#ff6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="font-display text-[44px] sm:text-[56px] font-normal text-wl-gold mb-4 leading-[1.15]">Unable to connect</h2>
            <p className="text-wl-ivory-dim text-[16px] mb-8 leading-relaxed max-w-xs mx-auto">{errorMessage || "Network error or the service is temporarily unavailable. Please try again later."}</p>
            <button onClick={() => { setMode("join"); setEmail(""); setName(""); setOrganization(""); setErrorMessage("") }} className="btn-gold w-full flex items-center justify-center shadow-[0_4px_24px_var(--gold-dim)]">Try Again</button>
          </motion.div>
        )}

        {/* ── STATUS CHECKER ── */}
        {mode === "status" && (
          <motion.div key="status" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center w-full max-w-lg mx-auto min-h-screen p-6 relative z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--gold-dim)_0%,_transparent_60%)] pointer-events-none" />
            <div className="flex justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/waitlist/logo.png" alt="UnSwap Logo" className="w-28 h-28 object-contain" />
            </div>
            {statusLinkSent ? (
              <>
                <h1 className="font-display text-[40px] sm:text-[56px] font-normal text-wl-ivory mb-6 tracking-tight leading-[1.1]">
                  Check your <em className="text-wl-gold-light italic">inbox</em>
                </h1>
                {/* Worded so it reveals nothing either way: the same message
                    appears whether or not the address is on the list. */}
                <p className="text-wl-ivory-dim text-[15px] leading-relaxed max-w-md">
                  If <span className="text-wl-ivory font-medium break-all">{checkEmail}</span> is on the
                  waitlist, we have sent your place and invitation link to that address.
                </p>
                <p className="text-wl-muted text-[13px] leading-relaxed mt-4 max-w-md">
                  It should arrive within a minute. Check your spam folder if you do not see it.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-[40px] sm:text-[56px] font-normal text-wl-ivory mb-4 tracking-tight leading-[1.1]">
                  Find your <em className="text-wl-gold-light italic">place in the queue</em>
                </h1>
                <p className="text-wl-ivory-dim text-[15px] leading-relaxed mb-8 max-w-md">
                  Enter your email and we will send your position and invitation link straight to your inbox.
                </p>
                <form onSubmit={handleCheckStatus} className="w-full flex flex-col items-center gap-4">
                  <label htmlFor="wl-check-email" className="sr-only">Email address</label>
                  <input id="wl-check-email" type="email" value={checkEmail} onChange={(e) => { setCheckEmail(e.target.value); if (errorMessage) setErrorMessage("") }} placeholder="email@example.com" required className={inputCls} />
                  <button type="submit" disabled={status === "loading"} className="btn-gold w-full flex items-center justify-center mt-2 group shadow-[0_4px_24px_var(--gold-dim)]">
                    {status === "loading" ? "Sending..." : "Email me my link"}
                  </button>
                </form>
              </>
            )}
            {errorMessage && <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[#ff6b6b] text-[14.5px] mt-6 mb-2">{errorMessage}</motion.p>}
            <button onClick={() => { setMode("join"); setErrorMessage(""); setStatusLinkSent(false) }} className="mt-8 text-wl-muted hover:text-wl-gold text-[11px] font-medium tracking-[0.18em] uppercase transition-colors">← Back to waitlist</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
