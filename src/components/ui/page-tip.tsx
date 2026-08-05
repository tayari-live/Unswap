"use client"

import { useEffect, useState } from "react"
import { Lightbulb, X } from "lucide-react"

/**
 * A one-line explainer shown at the top of a page the first time a member
 * lands on it, then dismissed for good.
 *
 * Persisted in localStorage rather than the database on purpose: a tip is not
 * worth a query on every page load, and the app deliberately keeps its database
 * traffic low. The cost is that a tip can reappear on a new device, which is
 * harmless for guidance of this kind.
 */
export function PageTip({ id, children }: { id: string; children: React.ReactNode }) {
  const key = `unswap_tip_${id}`
  // Start hidden: the server cannot know what this member has dismissed, so
  // rendering the tip during SSR would flash it at people who already closed it.
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(key) !== "dismissed") setShow(true)
    } catch {
      /* private mode / storage disabled — simply never show the tip */
    }
  }, [key])

  function dismiss() {
    setShow(false)
    try {
      localStorage.setItem(key, "dismissed")
    } catch {
      /* nothing to do; it will reappear next visit at worst */
    }
  }

  if (!show) return null

  return (
    <div className="flex items-start gap-3 border-l-2 border-[var(--gold)] bg-[var(--gold)]/[0.06] pl-4 pr-3 py-3 mb-6 rounded-r-sm">
      <Lightbulb size={16} strokeWidth={1.6} className="text-[var(--gold-soft)] flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-[13px] leading-relaxed text-neutral">{children}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="flex-shrink-0 text-neutral hover:text-[var(--fg)] transition-colors mt-0.5"
      >
        <X size={15} />
      </button>
    </div>
  )
}
