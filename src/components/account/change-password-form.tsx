"use client"

import { useState } from "react"
import { Eye, EyeOff, Check } from "lucide-react"
import { useToast } from "@/components/ui/toast"

const inputCls =
  "block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"

export function ChangePasswordForm() {
  const toast = useToast()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    if (next.length < 8) return toast("Your new password must be at least 8 characters.", "error")
    if (next !== confirm) return toast("The new passwords don't match.", "error")

    setLoading(true)
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not change your password.", "error")
        return
      }
      toast("Password updated.", "success")
      setSaved(true)
      setCurrent("")
      setNext("")
      setConfirm("")
    } catch {
      toast("Something went wrong. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className={labelCls}>Current password</label>
        <input
          id="currentPassword"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputCls}
          placeholder="••••••••"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="newPassword" className={labelCls}>New password</label>
          <input
            id="newPassword"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputCls}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelCls}>Confirm new password</label>
          <input
            id="confirmPassword"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            placeholder="Re-enter new password"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-neutral cursor-pointer select-none">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="inline-flex items-center gap-1.5 text-[var(--navy)] hover:text-[var(--gold-dark)] transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
          {show ? "Hide passwords" : "Show passwords"}
        </button>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 transition-colors shadow-sm"
      >
        {loading ? "Saving…" : saved ? (<><Check size={16} /> Updated</>) : "Update password"}
      </button>
    </form>
  )
}
