"use client"

import { useState } from "react"

export type Prefs = {
  notifySwaps: boolean
  notifyMessages: boolean
  notifyReviews: boolean
  notifyReminders: boolean
  notifyMarketing: boolean
}

const CATEGORIES: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "notifySwaps", label: "Swap requests & exchanges", desc: "Requests, accepts, counter-offers, and completions." },
  { key: "notifyMessages", label: "Messages", desc: "When another member messages you." },
  { key: "notifyReviews", label: "Reviews", desc: "When you receive a new review." },
  { key: "notifyReminders", label: "Reminders", desc: "Exchange-starts-soon and renewal reminders." },
  { key: "notifyMarketing", label: "Product news & offers", desc: "Occasional updates from UnSwap." },
]

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-[var(--teal)]" : "bg-neutral-light"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  )
}

export function NotificationPrefs({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial)
  const [saving, setSaving] = useState<string | null>(null)

  async function toggle(key: keyof Prefs) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setSaving(key)
    try {
      const res = await fetch("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      })
      if (!res.ok) setPrefs(prefs) // revert on failure
    } catch {
      setPrefs(prefs)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h2 className="font-display font-bold text-lg text-[var(--navy)]">Email preferences</h2>
        <p className="text-xs text-neutral mt-0.5">Choose which emails you receive. Security and billing emails are always sent.</p>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {CATEGORIES.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-4 px-6 py-3.5">
            <div>
              <div className="text-sm font-semibold text-[var(--navy)]">{c.label}</div>
              <div className="text-xs text-neutral">{c.desc}</div>
            </div>
            <Toggle on={prefs[c.key]} onClick={() => saving !== c.key && toggle(c.key)} />
          </div>
        ))}
      </div>
    </div>
  )
}
