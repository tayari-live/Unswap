import { redirect } from "next/navigation"
import { Check, BadgeCheck, Info, CheckCircle2 } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { CheckoutButton, CancelButton } from "./billing-buttons"

export const dynamic = "force-dynamic"

const TIERS = [
  { key: "limited_1x", name: "Limited 1X", price: "$129", per: "/yr", exchanges: "1 exchange / year", guarantee: "$500,000 guarantee" },
  { key: "standard_2x", name: "Standard 2X", price: "$219", per: "/yr", exchanges: "2 exchanges / year", guarantee: "$1,000,000 guarantee" },
  { key: "professional_4x", name: "Professional 4X", price: "$349", per: "/yr", exchanges: "4 exchanges / year", guarantee: "$1,500,000 guarantee", popular: true },
  { key: "unlimited_pro", name: "Unlimited Pro", price: "$449", per: "/yr", exchanges: "Unlimited exchanges", guarantee: "$2,000,000 + priority support" },
]
const TIER_LABELS: Record<string, string> = Object.fromEntries(TIERS.map((t) => [t.key, t.name]))
TIER_LABELS.lifetime = "Lifetime Access"

function fmt(d: Date | null) {
  return d ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d) : "—"
}

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ activated?: string; cancelled?: string }>
}) {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } })
  if (!user) redirect("/login")
  const sub = user.subscription
  const currentKey = sub?.tier ?? null
  const isLifetime = currentKey === "lifetime"

  const sp = await searchParams
  const activated = sp.activated && TIER_LABELS[sp.activated]

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <PageHeader title="Subscription" subtitle="Your membership and exchange entitlements." />

      {activated && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--teal)]/30 bg-[var(--teal-light)] p-4 mb-6">
          <CheckCircle2 size={20} className="text-[var(--teal)] flex-shrink-0" />
          <p className="text-sm font-semibold text-[var(--navy)]">Your {activated} membership is now active.</p>
        </div>
      )}
      {sp.cancelled && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-surface p-4 mb-6">
          <Info size={20} className="text-neutral flex-shrink-0" />
          <p className="text-sm text-neutral-dark">Checkout was cancelled. No changes were made.</p>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-[var(--navy)] text-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50 font-semibold">Current plan</div>
            <div className="mt-1 font-display text-2xl font-bold">
              {currentKey ? TIER_LABELS[currentKey] ?? currentKey : "No active plan"}
            </div>
            {sub && (
              <div className="mt-1 text-sm text-white/60">
                {sub.exchangesPerYear === -1 ? "Unlimited exchanges" : `${sub.exchangesPerYear} exchanges / year`} ·
                {" "}${sub.propertyGuarantee.toLocaleString()} guarantee
              </div>
            )}
          </div>
          {sub && (
            <div className="text-sm sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--teal)]/20 text-[var(--teal)] text-xs font-bold uppercase tracking-wide">
                {sub.status}
              </div>
              <div className="text-xs text-white/50 mt-2">
                {isLifetime ? "Lifetime — never expires" : `Renews ${fmt(sub.renewsAt)}`}
              </div>
              {!isLifetime && sub.status === "active" && (
                <div className="mt-2"><CancelButton /></div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 text-xs text-neutral bg-[var(--parchment)] border border-[var(--gold)]/20 rounded-xl p-3 mb-6">
        <Info size={16} className="text-[var(--gold-dark)] flex-shrink-0 mt-0.5" />
        <span>Plan changes are processed securely at checkout via Stripe. Upgrades take effect immediately; downgrades at the next renewal.</span>
      </div>

      {/* Tier ladder */}
      <h2 className="font-display font-bold text-lg text-[var(--navy)] mb-3">Membership tiers</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((t) => {
          const current = t.key === currentKey
          return (
            <div key={t.key} className={`relative rounded-2xl border p-5 flex flex-col ${current ? "border-[var(--gold)] ring-1 ring-[var(--gold)] shadow-md" : "border-[var(--border)] shadow-sm"}`}>
              {t.popular && !current && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide bg-[var(--gold)] text-[var(--navy)] px-3 py-1 rounded-full">Most popular</span>
              )}
              {current && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-[var(--navy)] text-white px-3 py-1 rounded-full">
                  <BadgeCheck size={12} className="text-[var(--gold)]" /> Current
                </span>
              )}
              <h3 className="font-display text-base font-bold text-[var(--navy)]">{t.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold text-[var(--navy)]">{t.price}</span>
                <span className="text-xs text-neutral">{t.per}</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-neutral-dark flex-1">
                <li className="flex gap-1.5"><Check size={14} className="text-[var(--teal)] flex-shrink-0 mt-0.5" /> {t.exchanges}</li>
                <li className="flex gap-1.5"><Check size={14} className="text-[var(--teal)] flex-shrink-0 mt-0.5" /> {t.guarantee}</li>
              </ul>
              <div className="mt-5">
                {current ? (
                  <div className="text-center text-xs font-semibold text-neutral py-2.5">Your current plan</div>
                ) : (
                  <CheckoutButton tier={t.key} label={currentKey ? "Switch plan" : "Choose plan"} variant={t.popular ? "primary" : "ghost"} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lifetime upsell */}
      {!isLifetime && (
        <div className="mt-6 rounded-2xl bg-[var(--navy)] text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-[var(--gold)]/15 text-[var(--gold)] flex items-center justify-center"><BadgeCheck size={24} /></span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold">Lifetime Access</h3>
                <span className="text-[10px] font-bold uppercase tracking-wide bg-[var(--gold)] text-[var(--navy)] px-2.5 py-1 rounded-full">Best value</span>
              </div>
              <p className="text-sm text-white/60 mt-1">Unlimited exchanges forever, $2,000,000 protection, priority support.</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="font-display text-2xl font-bold">$3,143</div>
              <div className="text-xs text-white/50">one-time</div>
            </div>
            <div className="w-32"><CheckoutButton tier="lifetime" label="Claim" variant="gold" /></div>
          </div>
        </div>
      )}
    </div>
  )
}
