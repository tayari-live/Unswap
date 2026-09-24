"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { useConfirm } from "@/components/ui/confirm"

export function CheckoutButton({
  tier,
  label,
  variant = "primary",
}: {
  tier: string
  label: string
  variant?: "primary" | "ghost" | "gold"
}) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  async function go() {
    setLoading(true)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast(data.error || "Could not start checkout.", "error")
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      toast("Something went wrong.", "error")
      setLoading(false)
    }
  }

  const styles =
    variant === "gold"
      ? "bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-hover)]"
      : variant === "ghost"
        ? "border border-[var(--hair)] text-[var(--fg)] hover:border-[var(--navy)]"
        : "bg-[var(--gold-dark)] text-white hover:bg-[var(--gold-hover)]"

  return (
    <button
      onClick={go}
      disabled={loading}
      className={`w-full text-center text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 ${styles}`}
    >
      {loading ? "Redirecting…" : label}
    </button>
  )
}

export function CancelButton() {
  const router = useRouter()
  const confirm = useConfirm()
  const [loading, setLoading] = useState(false)

  async function cancel() {
    if (!(await confirm({
      title: "Cancel membership",
      message: "Cancel your membership? You'll keep access until the end of the current period.",
      confirmLabel: "Cancel membership",
      cancelLabel: "Keep membership",
      tone: "danger",
    }))) return
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

export function ResumeButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function resume() {
    setLoading(true)
    try {
      const res = await fetch("/api/billing/resume", { method: "POST" })
      if (res.ok) router.refresh()
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={resume}
      disabled={loading}
      className="text-xs font-semibold text-[var(--gold)] hover:text-white underline disabled:opacity-50"
    >
      {loading ? "Resuming…" : "Resume membership"}
    </button>
  )
}
