"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
import { useToast } from "@/components/ui/toast"

/** Lets a member report a message or review for moderation. */
export function ReportButton({
  targetType,
  targetId,
  variant = "icon",
}: {
  targetType: "message" | "review"
  targetId: string
  variant?: "icon" | "link"
}) {
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function report() {
    if (done || busy) return
    const reason = window.prompt("Why are you reporting this? (optional)") ?? undefined
    setBusy(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason }),
      })
      if (res.ok) {
        setDone(true)
        toast("Thanks — our team will review this.", "success")
      } else {
        toast("Could not submit the report", "error")
      }
    } finally {
      setBusy(false)
    }
  }

  if (variant === "link") {
    return (
      <button
        onClick={report}
        disabled={done}
        className="inline-flex items-center gap-1 text-xs font-semibold text-neutral hover:text-[var(--crimson)] disabled:text-[var(--teal)] transition-colors"
      >
        <Flag size={12} /> {done ? "Reported" : "Report"}
      </button>
    )
  }

  return (
    <button
      onClick={report}
      disabled={done}
      aria-label={done ? "Reported" : "Report message"}
      title={done ? "Reported" : "Report message"}
      className="text-neutral/60 hover:text-[var(--crimson)] disabled:text-[var(--teal)] transition-colors"
    >
      <Flag size={13} fill={done ? "currentColor" : "none"} />
    </button>
  )
}
