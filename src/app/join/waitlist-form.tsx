"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, Copy, Sparkles, Trophy } from "lucide-react"

const inputCls =
  "block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)] text-sm text-[var(--navy)] transition-all"
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2"

type Result = {
  alreadyJoined: boolean
  referralUrl: string
  position: number
  earlyBird: boolean
}

export function WaitlistForm() {
  const ref = useSearchParams().get("ref") || undefined
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, ref }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not join the waitlist.")
        setLoading(false)
        return
      }
      setResult(data)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  function copy() {
    if (!result) return
    navigator.clipboard?.writeText(result.referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (result) {
    return (
      <div className="text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--teal-light)] text-[var(--teal)] flex items-center justify-center mb-5">
          <Check size={26} />
        </div>
        <h1 className="font-display text-3xl font-bold text-[var(--navy)]">
          {result.alreadyJoined ? "You're already on the list" : "You're on the list"}
        </h1>
        <p className="mt-3 text-neutral">
          You&apos;re <span className="font-bold text-[var(--navy)]">#{result.position}</span> in line for early access.
        </p>

        {result.earlyBird && (
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold-dark)] bg-[var(--parchment)] border border-[var(--gold)]/30 rounded-xl px-4 py-2.5">
            <Sparkles size={16} /> Founding member: 50% off Limited 1X at launch
          </div>
        )}

        <div className="mt-7 text-left">
          <label className={labelCls}>Your referral link</label>
          <div className="flex gap-2">
            <input readOnly value={result.referralUrl} className={`${inputCls} flex-1`} />
            <button onClick={copy} className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--navy)] hover:bg-[var(--navy-light)] transition-colors">
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral">Refer 5+ peers to earn 6 months of Unlimited Pro, free.</p>
        </div>

        <Link href="/early-access" className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)]">
          <Trophy size={15} /> See the referral leaderboard
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-[var(--navy)]">Join the waitlist</h1>
      <p className="mt-2 text-neutral text-sm">
        Be among the first verified members of the UnSwap home exchange network.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-5">
        {error && (
          <div className="bg-[var(--crimson)]/10 border-l-4 border-[var(--crimson)] p-3 rounded-lg">
            <p className="text-sm text-[var(--crimson)] font-medium">{error}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={labelCls}>First name</label>
            <input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={inputCls} />
          </div>
          <div>
            <label htmlFor="lastName" className={labelCls}>Last name</label>
            <input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>Work email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="j.doe@un.org" className={inputCls} />
        </div>
        {ref && <p className="text-xs text-[var(--teal)] font-medium">You were referred by a member — you&apos;ll both move up the list.</p>}
        <button type="submit" disabled={loading} className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] disabled:opacity-50 transition-colors shadow-sm">
          {loading ? "Joining…" : "Join the waitlist"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-neutral">
        Already verified?{" "}
        <Link href="/register" className="font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)]">Create your account</Link>
      </p>
    </>
  )
}
