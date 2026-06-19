"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function CheckoutButton({
  tier,
  label,
  variant = "primary",
}: {
  tier: string
  label: string
  variant?: "primary" | "ghost" | "gold"
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function go() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || "Could not start checkout.")
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError("Something went wrong.")
      setLoading(false)
    }
  }

  const styles =
    variant === "gold"
      ? "bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-hover)]"
      : variant === "ghost"
        ? "border border-[var(--border)] text-[var(--navy)] hover:border-[var(--navy)]"
        : "bg-[var(--gold-dark)] text-white hover:bg-[var(--gold-hover)]"

  return (
    <div>
      <button
        onClick={go}
        disabled={loading}
        className={`w-full text-center text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 ${styles}`}
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && <p className="mt-1.5 text-xs text-[var(--crimson)] font-medium">{error}</p>}
    </div>
  )
}

export function CancelButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function cancel() {
    if (!confirm("Cancel your membership? You'll keep access until the end of the current period.")) return
    setLoading(true)
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" })
      if (res.ok) router.refresh()
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={cancel}
      disabled={loading}
      className="text-xs font-semibold text-white/70 hover:text-white underline disabled:opacity-50"
    >
      {loading ? "Cancelling…" : "Cancel membership"}
    </button>
  )
}
