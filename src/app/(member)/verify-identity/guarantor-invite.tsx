"use client"

import { useState } from "react"
import { UserCheck, ArrowRight, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { FIELD, LABEL } from "@/components/ui/form"

/**
 * The guarantor path: a member with no institutional email of their own names a
 * UN/IO colleague, who is emailed a link to confirm and explicitly vouch. Their
 * approval stands in for institutional-email verification.
 */
export function GuarantorInvite() {
  const toast = useToast()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/verification/guarantor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not send the invitation.", "error")
        setLoading(false)
        return
      }
      setSentTo(data.guarantorEmail || email.trim())
    } catch {
      toast("Something went wrong. Please try again.", "error")
      setLoading(false)
    }
  }

  if (sentTo) {
    return (
      <div className="bg-[var(--teal-light)] border border-[var(--teal)]/30 rounded-md p-5 flex items-start gap-3">
        <CheckCircle2 size={20} className="text-[var(--teal)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[var(--fg)]">Invitation sent</p>
          <p className="mt-1 text-sm text-neutral-dark leading-relaxed">
            We&apos;ve asked <span className="font-semibold text-[var(--fg)]">{sentTo}</span> to vouch
            for you. As soon as they approve, you&apos;ll be verified — we&apos;ll email you.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-[var(--navy)]/5 text-[var(--gold-dark)] flex items-center justify-center flex-shrink-0">
          <UserCheck size={20} />
        </div>
        <div>
          <h2 className="font-sans text-lg font-semibold text-[var(--fg)]">Ask a colleague to vouch for you</h2>
          <p className="mt-1 text-sm text-neutral-dark leading-relaxed">
            No institutional email of your own? Enter a UN/IO colleague&apos;s work address. They&apos;ll
            confirm they know you, and that vouch verifies you.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="g-name" className={LABEL}>Their name <span className="text-neutral normal-case font-normal">(optional)</span></label>
            <input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Colleague's name" className={FIELD} />
          </div>
          <div>
            <label htmlFor="g-email" className={LABEL}>Their institutional email</label>
            <input id="g-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@un.org" className={FIELD} autoComplete="off" />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Sending…" : <>Send invitation <ArrowRight size={16} /></>}
        </button>
      </form>
    </div>
  )
}
