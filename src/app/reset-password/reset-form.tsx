"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"

export function ResetForm() {
  const params = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const token = params.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return toast("Password must be at least 8 characters.", "error")
    if (password !== confirm) return toast("Passwords do not match.", "error")
    if (!token) return toast("This reset link is missing its token.", "error")

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not reset your password.", "error")
        setLoading(false)
        return
      }
      setDone(true)
      toast("Password updated.", "success")
      setTimeout(() => router.push("/login"), 2500)
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--teal-light)] text-[var(--teal)] flex items-center justify-center mb-5">
          <CheckCircle2 size={26} />
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--navy)]">Password updated</h1>
        <p className="mt-3 text-neutral">Redirecting you to sign in…</p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors"
        >
          Sign in now
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-[var(--navy)]">Choose a new password</h1>
      <p className="mt-2 text-neutral text-sm">Enter a new password for your account.</p>

      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2">
            New Password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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

        <div>
          <label htmlFor="confirm" className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2">
            Confirm Password
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--gold)] disabled:opacity-50 transition-all duration-200 shadow-sm"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
        <Link href="/login" className="text-sm font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)] transition-colors">
          Back to sign in
        </Link>
      </div>
    </>
  )
}
