"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/toast"

/** Lets someone whose link expired request a fresh confirmation email. */
export function ResendVerification() {
  const toast = useToast()
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setState("sending")
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
    } catch {
      /* always show a neutral confirmation */
    }
    setState("sent")
    toast("If that account still needs confirming, a new link is on its way.", "success")
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@organisation.org"
        className="flex-1 px-4 py-2.5 border border-wl-border bg-transparent text-sm text-wl-ivory placeholder:text-wl-muted focus:outline-none focus:border-wl-gold transition-colors"
      />
      <button
        type="submit"
        disabled={state !== "idle"}
        className="py-2.5 px-5 text-[12px] font-medium uppercase tracking-[0.1em] text-[#0a0e1a] bg-wl-gold hover:bg-wl-gold-light disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {state === "sending" ? "Sending…" : state === "sent" ? "Sent" : "Resend link"}
      </button>
    </form>
  )
}
