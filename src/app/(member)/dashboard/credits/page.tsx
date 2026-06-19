import { redirect } from "next/navigation"
import { Coins, ArrowUpRight, ArrowDownRight, Info } from "lucide-react"
import { auth } from "@/server/auth"
import { getCreditsLedger } from "@/server/services/credits"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

export default async function CreditsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const { balance, earned, spent, transactions } = await getCreditsLedger(userId)

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <PageHeader title="UnSwap Credits" subtitle="Host now, stay later. Your non-simultaneous exchange balance." />

      {/* Balance + summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--navy)] text-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-wide font-semibold">
            <Coins size={15} className="text-[var(--gold)]" /> Balance
          </div>
          <div className="mt-3 font-display text-4xl font-bold">{balance}</div>
          <div className="text-xs text-white/50 mt-1">credit{balance === 1 ? "" : "s"} available</div>
        </div>
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <div className="text-xs text-neutral uppercase tracking-wide font-semibold">Earned</div>
          <div className="mt-3 font-display text-3xl font-bold text-[var(--teal)]">+{earned}</div>
          <div className="text-xs text-neutral mt-1">nights hosted</div>
        </div>
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <div className="text-xs text-neutral uppercase tracking-wide font-semibold">Spent</div>
          <div className="mt-3 font-display text-3xl font-bold text-[var(--navy)]">-{spent}</div>
          <div className="text-xs text-neutral mt-1">nights stayed</div>
        </div>
      </div>

      <div className="flex items-start gap-2.5 text-xs text-neutral bg-[var(--parchment)] border border-[var(--gold)]/20 rounded-xl p-3 mb-6">
        <Info size={16} className="text-[var(--gold-dark)] flex-shrink-0 mt-0.5" />
        <span>1 night hosted earns 1 credit. 1 credit redeems 1 night at any member&apos;s home through a non-simultaneous swap.</span>
      </div>

      {/* Ledger */}
      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-display font-bold text-lg text-[var(--navy)]">Earn & spend history</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-neutral">No credit activity yet. Host a member to start earning.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.amount > 0 ? "bg-[var(--teal)]/15 text-[var(--teal)]" : "bg-[var(--navy)]/10 text-[var(--navy)]"}`}>
                    {t.amount > 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--navy)]">{t.title}</div>
                    <div className="text-xs text-neutral">{t.listing} · {fmt(t.date)}</div>
                  </div>
                </div>
                <span className={`text-sm font-bold ${t.amount > 0 ? "text-[var(--teal)]" : "text-[var(--navy)]"}`}>
                  {t.amount > 0 ? `+${t.amount}` : t.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
