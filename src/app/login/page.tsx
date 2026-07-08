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
        {/* Soft, warm overlay to let the white card pop, similar to the reference */}
        <div className="absolute inset-0 bg-[#fdfbf7]/80 backdrop-blur-[2px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 sm:p-10 border border-[var(--border)]">
        <div className="flex justify-center mb-8">
          <Logo wordClassName="text-[var(--navy)]" />
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-[var(--navy)]">
          Log in
        </h2>
        
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--teal)] bg-[var(--teal-light)] py-1.5 px-3 rounded-full w-fit mx-auto">
          <ShieldCheck size={14} />
          Verified institutional access
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-[var(--crimson)]/10 border-l-4 border-[var(--crimson)] p-3 rounded-lg">
              <p className="text-sm text-[var(--crimson)] font-medium">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-[var(--navy)] mb-1.5"
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
                className="block w-full pl-4 pr-11 py-3 border border-neutral/30 rounded-xl bg-white placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-[var(--teal)]/30 focus:border-[var(--teal)] text-sm text-[var(--navy)] transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[var(--navy)]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors"
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
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            {loading ? "Signing in..." : "Continue with email"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
          <p className="text-sm text-neutral">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors underline decoration-2 underline-offset-4"
            >
              Sign up for free
            </Link>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-neutral/70 text-center leading-tight">
          UnSwap is an independent, staff-led platform, not affiliated with the United Nations.
        </div>
      </div>
    </div>
  )
}
