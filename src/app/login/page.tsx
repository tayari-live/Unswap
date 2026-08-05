"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Mail, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { ThemeToggleIcon } from "@/components/theme/theme-toggle"

const inputCls =
  "w-full bg-[var(--field-bg)] border border-wl-border px-5 py-4 text-wl-ivory placeholder-wl-muted focus:outline-none focus:border-wl-gold focus:shadow-[0_0_0_1px_var(--border)] transition-all duration-300 text-[15px]"
const labelCls = "block text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1"

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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
        toast("Those credentials were not recognised. Please try again.", "error")
        setLoading(false)
      } else {
        const session = await getSession()
        const role = (session?.user as any)?.role
        router.push(role === "admin" ? "/overview" : "/dashboard")
        router.refresh()
      }
    } catch (err: any) {
      const detail = String(err?.type || err?.name || err?.message || "")
      if (detail.toLowerCase().includes("credentials")) {
        toast("Those credentials were not recognised. Please try again.", "error")
      } else {
        toast("Something went wrong. Please try again.", "error")
      }
      setLoading(false)
    }
  }

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/waitlist/logo.png" alt="UnSwap" className="w-24 h-24 object-contain" />
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className={labelCls}>Work email</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-wl-muted" />
                </div>
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organisation.int" className={`${inputCls} pr-11`} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 pl-1">
                <label htmlFor="password" className="text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium tracking-[0.06em] uppercase text-wl-gold hover:text-wl-gold-light transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputCls} pr-11`} />
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
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-wl-border text-center">
            <p className="text-sm text-wl-ivory-dim">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-wl-gold hover:text-wl-gold-light transition-colors">Sign up</Link>
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] text-wl-muted">
            UnSwap is an independent, staff-led platform, not affiliated with the United Nations.
          </p>
        </div>
      </div>
    </div>
  )
}
