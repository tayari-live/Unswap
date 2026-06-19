"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { PageHeader } from "@/components/ui/page-header"

const NAVY = "#0B1F3A"
const GOLD = "#C9A84C"
const TEAL = "#2A9D8F"
const PIE_COLORS = [NAVY, GOLD, TEAL, "#13355f", "#9a7c2c", "#6B7689"]

const TIER_LABELS: Record<string, string> = {
  limited_1x: "Limited 1X",
  standard_2x: "Standard 2X",
  professional_4x: "Professional 4X",
  unlimited_pro: "Unlimited Pro",
  lifetime: "Lifetime",
}

type Data = {
  series: { month: string; signups: number; swaps: number; verifications: number }[]
  tierDistribution: { tier: string; count: number }[]
  topStations: { station: string; count: number }[]
}

export default function AnalyticsClient({ data }: { data: Data }) {
  const pieData = data.tierDistribution.map((t) => ({ name: TIER_LABELS[t.tier] ?? t.tier, value: t.count }))

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PageHeader title="Analytics" subtitle="Growth, verification throughput, and where the network is concentrated." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <h2 className="font-display font-bold text-[var(--navy)] mb-4">Signups &amp; Swaps · last 6 months</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gNavy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={NAVY} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={NAVY} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E7EE" />
                <XAxis dataKey="month" stroke="#6B7689" fontSize={12} />
                <YAxis stroke="#6B7689" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E3E7EE" }} />
                <Area type="monotone" dataKey="signups" name="Signups" stroke={NAVY} fill="url(#gNavy)" strokeWidth={2} />
                <Area type="monotone" dataKey="swaps" name="Swaps" stroke={GOLD} fill="url(#gGold)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <h2 className="font-display font-bold text-[var(--navy)] mb-4">Tier Distribution</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-neutral">No active subscriptions yet.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={75} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <h2 className="font-display font-bold text-[var(--navy)] mb-4">Verifications · last 6 months</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.series} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E7EE" vertical={false} />
                <XAxis dataKey="month" stroke="#6B7689" fontSize={12} />
                <YAxis stroke="#6B7689" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E3E7EE" }} />
                <Bar dataKey="verifications" name="Verified" fill={TEAL} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <h2 className="font-display font-bold text-[var(--navy)] mb-4">Popular Duty Stations</h2>
          {data.topStations.length === 0 ? (
            <p className="text-sm text-neutral">No listings yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topStations.map((s) => {
                const max = data.topStations[0].count || 1
                return (
                  <div key={s.station}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-neutral-dark">{s.station}</span>
                      <span className="text-neutral">{s.count} listing{s.count > 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-neutral-light overflow-hidden">
                      <div className="h-full bg-[var(--navy)]" style={{ width: `${(s.count / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
