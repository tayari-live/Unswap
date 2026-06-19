"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"

/** Opens (or creates) a conversation with another member, then navigates to it. */
export function MessageButton({
  otherUserId,
  swapRequestId,
  label = "Message",
  className,
}: {
  otherUserId: string
  swapRequestId?: string
  label?: string
  className?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function open() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId, swapRequestId }),
      })
      const data = await res.json()
      if (res.ok && data.id) router.push(`/dashboard/messages/${data.id}`)
      else setBusy(false)
    } catch {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={open}
      disabled={busy}
      className={
        className ??
        "inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold text-[var(--navy)] border border-[var(--border)] hover:border-[var(--navy)] disabled:opacity-50 transition-colors"
      }
    >
      <MessageSquare size={16} /> {busy ? "Opening…" : label}
    </button>
  )
}
