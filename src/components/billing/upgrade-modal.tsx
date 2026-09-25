"use client"

import { useRouter } from "next/navigation"
import { ArrowUpRight, Check, Sparkles } from "lucide-react"
import { Modal } from "@/components/ui/modal"

// Display ladder for the upsell — name + annual exchange allowance only. Pricing
// lives on the subscription page (single source of truth), which the CTA opens.
const LADDER = [
  { key: "limited_1x", name: "Limited 1X", exchanges: 1 },
  { key: "standard_2x", name: "Standard 2X", exchanges: 2 },
  { key: "professional_4x", name: "Professional 4X", exchanges: 4 },
  { key: "unlimited_pro", name: "Unlimited Pro", exchanges: -1 },
] as const

const exchangesLabel = (n: number) =>
  n === -1 ? "Unlimited exchanges" : `${n} exchange${n === 1 ? "" : "s"} / year`

/**
 * Shown when a member hits their plan's annual exchange limit while requesting a
 * swap — turns the block into an upgrade prompt. Lists the tiers above their
 * current one and links to checkout.
 */
export function UpgradeModal({
  open,
  onClose,
  tier,
  exchangesPerYear,
}: {
  open: boolean
  onClose: () => void
  tier?: string
  exchangesPerYear?: number
}) {
  const router = useRouter()
  const current = exchangesPerYear ?? 1
  const currentName = LADDER.find((t) => t.key === tier)?.name ?? "your current plan"
  // Only tiers that grant more exchanges than the current one are worth upselling.
  const upgrades = LADDER.filter((t) => t.exchanges === -1 || t.exchanges > current)

  return (
    <Modal open={open} onClose={onClose} title="You've reached your exchange limit">
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-md bg-[var(--gold)]/12 text-[var(--gold-dark)] flex items-center justify-center">
            <Sparkles size={20} />
          </span>
          <p className="text-sm text-neutral-dark leading-relaxed">
            <span className="font-semibold text-[var(--fg)]">{currentName}</span> includes{" "}
            {exchangesLabel(current).toLowerCase()}, and you&apos;ve used{" "}
            {current === 1 ? "it" : "them all"} this period. Upgrade for more exchanges — your new
            allowance applies immediately.
          </p>
        </div>

        {upgrades.length > 0 && (
          <ul className="space-y-2">
            {upgrades.map((t) => (
              <li
                key={t.key}
                className="flex items-center justify-between rounded-xl border border-[var(--hair)] px-4 py-3"
              >
                <span className="font-sans font-semibold text-[var(--fg)]">{t.name}</span>
                <span className="inline-flex items-center gap-1.5 text-sm text-neutral-dark">
                  <Check size={14} className="text-[var(--teal)]" /> {exchangesLabel(t.exchanges)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[var(--hair)] text-sm font-semibold text-[var(--fg)] hover:bg-[var(--gold)]/10 transition-colors"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/subscription")}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors"
          >
            View upgrade options <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </Modal>
  )
}
