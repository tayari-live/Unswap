"use client"

import { useState } from "react"
import Link from "next/link"
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react"

export function GuarantorRespond({
  token,
  memberName,
  memberFirstName,
  organisation,
}: {
  token: string
  memberName: string
  memberFirstName: string
  organisation: string | null
}) {
  const [done, setDone] = useState<"approved" | "declined" | null>(null)
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null)
  const [error, setError] = useState("")

  const respond = async (approve: boolean) => {
    setLoading(approve ? "approve" : "decline")
    setError("")
    try {
      const res = await fetch("/api/verification/guarantor/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, approve }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        setLoading(null)
        return
      }
      setDone(approve ? "approved" : "declined")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(null)
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className={`mx-auto w-16 h-16 border flex items-center justify-center mb-6 ${done === "approved" ? "border-wl-border text-wl-gold" : "border-wl-border text-wl-ivory-dim"}`}>
          {done === "approved" ? <CheckCircle2 size={26} strokeWidth={1.4} /> : <XCircle size={26} strokeWidth={1.4} />}
        </div>
        <p className="text-sm text-wl-ivory-dim leading-relaxed">
          {done === "approved"
            ? `Thank you. ${memberFirstName} is now verified on UnSwap thanks to your vouch.`
            : `You've declined. ${memberFirstName} won't be verified through you, and no account was created for you.`}
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 border border-wl-border text-wl-gold flex items-center justify-center mb-6">
        <ShieldCheck size={26} strokeWidth={1.4} />
      </div>
      <p className="text-sm text-wl-ivory leading-relaxed">
        <span className="font-semibold">{memberName}</span>
        {organisation ? ` (${organisation})` : ""} has named you as their guarantor on UnSwap.
      </p>
      <p className="mt-3 text-sm text-wl-ivory-dim leading-relaxed">
        If you know {memberFirstName} and can confirm they are a UN/IO colleague, approve below —
        your vouch stands in for institutional-email verification. Only approve someone you actually know.
      </p>

      {error && (
        <div className="mt-5 border-l-2 border-[rgba(193,18,31,0.5)] bg-[rgba(193,18,31,0.08)] px-4 py-3 text-sm text-wl-ivory text-left">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => respond(true)}
          disabled={!!loading}
          className="flex-1 inline-flex justify-center items-center text-[12px] font-medium uppercase tracking-[0.12em] text-ink bg-wl-gold hover:bg-wl-gold-light px-8 py-3.5 transition-colors disabled:opacity-50"
        >
          {loading === "approve" ? "Approving…" : `Approve ${memberFirstName}`}
        </button>
        <button
          onClick={() => respond(false)}
          disabled={!!loading}
          className="flex-1 inline-flex justify-center items-center text-[12px] font-medium uppercase tracking-[0.1em] text-wl-ivory-dim border border-wl-border hover:text-wl-ivory px-8 py-3.5 transition-colors disabled:opacity-50"
        >
          {loading === "decline" ? "…" : "Decline"}
        </button>
      </div>

      <p className="mt-6 text-[11px] text-wl-muted">
        <Link href="/" className="hover:text-wl-gold transition-colors">What is UnSwap?</Link>
      </p>
    </div>
  )
}
