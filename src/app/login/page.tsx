"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Mail, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Logo } from "@/components/brand/logo"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        email,
        password,
        remember: remember ? "true" : "false",
        redirect: false,
      })

      if (res?.error) {
        setError("Those credentials were not recognised. Please try again.")
        setLoading(false)
      } else {
        // Route by role: admins to the ops console, members to their dashboard.
        const session = await getSession()
        const role = (session?.user as any)?.role
        router.push(role === "admin" ? "/overview" : "/dashboard")
        router.refresh()
      }
    } catch (err: any) {
      // NextAuth v5 beta throws (instead of returning res.error) on a failed
      // credentials sign-in. Treat that as invalid credentials.
      const detail = String(err?.type || err?.name || err?.message || "")
      if (detail.toLowerCase().includes("credentials")) {
        setError("Those credentials were not recognised. Please try again.")
      } else {
        setError("Something went wrong. Please try again.")
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — institutional branding over a photographic backdrop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 relative overflow-hidden text-white">
        <Image
          src="/images/auth-institution.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--navy)]/85 via-[var(--navy)]/80 to-[var(--navy-dark)]/95" />

        <Logo
          className="relative z-10 text-white"
          markClassName="w-10 h-10 text-[var(--gold)]"
          wordClassName="text-white text-2xl"
        />

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
            Welcome back to the network
          </h1>
          <p className="mt-4 text-white/60 leading-relaxed">
            Sign in to manage verifications, listings, and exchanges across the
            UnSwap home exchange network for UN and international organisation
            professionals.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-white/50">
          <ShieldCheck size={16} className="text-[var(--gold)]" />
          Verified institutional access
        </div>
      </div>

      {/* Right panel — sign-in form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-[var(--background)]">
        <div className="w-full max-w-md">
          {/* Compact logo for small screens where the left panel is hidden */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo underline wordClassName="text-[var(--navy)]" />
          </div>

          <h2 className="font-display text-3xl font-bold text-[var(--navy)]">
            Member Login
          </h2>
          <p className="mt-2 text-neutral">
            Please provide your institutional credentials to access the secure
            dashboard.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-[var(--crimson)]/10 border-l-4 border-[var(--crimson)] p-3 rounded-lg">
                <p className="text-sm text-[var(--crimson)] font-medium">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"
              >
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-neutral" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organisation.int"
                  className="block w-full pl-4 pr-11 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold uppercase tracking-wider text-[var(--gold-dark)] hover:text-[var(--gold-hover)] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-4 pr-11 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
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

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--navy)] accent-[var(--navy)] focus:ring-[var(--gold)]/40"
              />
              <span className="text-sm text-neutral">Keep me signed in</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-sm text-neutral">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)] transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral">
            <Image
              src="/unswap-logo.png"
              alt="UnSwap"
              width={16}
              height={16}
              className="w-4 h-4 object-contain rounded-sm opacity-60"
            />
            UnSwap is an independent, staff-led platform, not affiliated with the
            United Nations.
          </div>
        </div>
      </div>
    </div>
  )
}
