import Link from "next/link"
import {
  ShieldCheck,
  Users,
  Home,
  ArrowLeftRight,
  AlertTriangle,
  Flag,
  DollarSign,
  ChevronRight,
  Activity,
} from "lucide-react"
import { getOverviewStats } from "@/server/services/dashboard"
import { prisma } from "@/server/prisma"
import { LuxPageHeader, LuxCard, SectionLabel } from "@/components/ui/lux"

export const dynamic = "force-dynamic"

const TIER_LABELS: Record<string, string> = {
  limited_1x: "Limited 1X",
  standard_2x: "Standard 2X",
  professional_4x: "Professional 4X",
  unlimited_pro: "Unlimited Pro",
  lifetime: "Lifetime",
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`
  const dy = Math.floor(h / 24)
  return `${dy} day${dy === 1 ? "" : "s"} ago`
}

function prettifyAction(action: string): string {
  return action.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())
}

export default async function OverviewPage() {
  const [stats, openReports, recentActivity] = await Promise.all([
    getOverviewStats(),
    prisma.report.count({ where: { status: "open" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ])

  const cards = [
    { label: "Verified Members", value: stats.verifiedMembers, icon: Users, href: "/members" },
    { label: "Active Properties", value: stats.activeListings, icon: Home, href: "/listings" },
    { label: "Active Exchanges", value: stats.swapsInProgress, icon: ArrowLeftRight, href: "/swaps" },
    { label: "Pending Verification", value: stats.pendingVerifications, icon: ShieldCheck, href: "/verification", alert: stats.pendingVerifications > 0 },
    { label: "Open Disputes", value: stats.openDisputes, icon: AlertTriangle, href: "/swaps", alert: stats.openDisputes > 0 },
    { label: "Est. Revenue", value: `$${stats.mrr.toLocaleString()}`, icon: DollarSign, href: "/analytics" },
  ] as const

  const attention = [
    stats.pendingVerifications > 0 && {
      icon: ShieldCheck,
      count: stats.pendingVerifications,
      label: `identity verification${stats.pendingVerifications === 1 ? "" : "s"} pending`,
      href: "/verification",
      urgent: false,
    },
    openReports > 0 && {
      icon: Flag,
      count: openReports,
      label: `report${openReports === 1 ? "" : "s"} requiring investigation`,
      href: "/moderation",
      urgent: openReports >= 3,
    },
    stats.openDisputes > 0 && {
      icon: AlertTriangle,
      count: stats.openDisputes,
      label: `swap${stats.openDisputes === 1 ? "" : "s"} escalated`,
      href: "/swaps",
      urgent: true,
    },
  ].filter(Boolean) as { icon: typeof ShieldCheck; count: number; label: string; href: string; urgent: boolean }[]

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <LuxPageHeader
        eyebrow="The Console"
        title="Dashboard"
        subtitle="An operational snapshot of the UnSwap verified exchange network."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group bg-[var(--surface)] rounded-md p-5 border border-[var(--navy)]/10 hover:border-[var(--gold)] hover:bg-[var(--parchment)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 border border-[var(--hair)] flex items-center justify-center text-[var(--gold-soft)] group-hover:border-[var(--gold)] transition-colors">
                <c.icon size={17} strokeWidth={1.4} />
              </span>
              <ChevronRight size={15} className="text-neutral group-hover:text-[var(--gold-soft)] transition-colors" />
            </div>
            <div className={`mt-4 font-display font-light text-3xl leading-none ${"alert" in c && c.alert ? "text-[var(--crimson)]" : "text-[var(--fg)]"}`}>
              {c.value}
            </div>
            <div className="text-[10px] text-neutral uppercase tracking-[0.16em] mt-2 font-medium">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* Attention required — the single most important section on this page:
          every admin page should answer "what needs my attention?" first. */}
      {attention.length > 0 && (
        <LuxCard className="mb-5 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-[var(--hair)]">
            <SectionLabel>Attention Required</SectionLabel>
          </div>
          <div className="divide-y divide-[var(--hair)]">
            {attention.map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-[var(--parchment)] transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${a.urgent ? "bg-[var(--crimson)]/10 text-[var(--crimson)]" : "bg-[var(--gold)]/15 text-[var(--gold-dark)]"}`}>
                    <a.icon size={16} />
                  </span>
                  <div className="text-sm text-[var(--fg)]">
                    <span className="font-semibold">{a.count}</span> {a.label}
                  </div>
                </div>
                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--gold-soft)] whitespace-nowrap">Review &rarr;</span>
              </Link>
            ))}
          </div>
        </LuxCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent activity — real audit-log entries, not a decorative feed. */}
        <LuxCard className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--hair)]">
            <SectionLabel>Recent Activity</SectionLabel>
            <Link href="/analytics" className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--gold-soft)] hover:text-[var(--gold)] transition-colors whitespace-nowrap flex items-center gap-1">
              <Activity size={12} /> Full analytics
            </Link>
          </div>
          <div className="divide-y divide-[var(--hair)]">
            {recentActivity.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-neutral">No activity recorded yet.</p>
            )}
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-6 py-3.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] flex-shrink-0 mt-2" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-[var(--fg)] truncate">{a.subject}</div>
                  <div className="text-xs text-neutral mt-0.5">{prettifyAction(a.action)} · {timeAgo(a.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </LuxCard>

        {/* Tier distribution — a simple proportional list, not a decorative chart. */}
        <LuxCard className="p-6">
          <SectionLabel>Revenue</SectionLabel>
          <h2 className="font-sans font-semibold text-lg text-[var(--fg)] leading-none mb-5">Subscription Mix</h2>
          {stats.tierDistribution.length === 0 && (
            <p className="text-sm text-neutral">No active subscriptions yet.</p>
          )}
          <div className="space-y-4">
            {stats.tierDistribution.map((t) => {
              const total = stats.tierDistribution.reduce((s, x) => s + x.count, 0) || 1
              const pct = Math.round((t.count / total) * 100)
              return (
                <div key={t.tier}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-[var(--fg)]">{TIER_LABELS[t.tier] ?? t.tier}</span>
                    <span className="text-neutral tabular-nums">{t.count}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--hair)] overflow-hidden">
                    <div className="h-full bg-[var(--gold)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </LuxCard>
      </div>
    </div>
  )
}
