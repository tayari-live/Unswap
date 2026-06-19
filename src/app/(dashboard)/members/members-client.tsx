"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, ShieldCheck, Ban, Star, ChevronDown } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { VerificationBadge, Badge } from "@/components/ui/badges"

type Member = {
  id: string
  fullName: string
  email: string
  avatarInitials: string
  organisation: string | null
  dutyStation: string | null
  nationality: string | null
  verificationStatus: string
  trustScore: number | null
  profileCompletion: number
  subscription: { tier: string } | null
  _count: { listings: number }
}

const TIER_LABELS: Record<string, string> = {
  limited_1x: "Limited 1X",
  standard_2x: "Standard 2X",
  professional_4x: "Professional 4X",
  unlimited_pro: "Unlimited Pro",
  lifetime: "Lifetime",
}

export default function MembersClient({ initialMembers }: { initialMembers: Member[] }) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter((m) => {
      const matchesQuery =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.organisation ?? "").toLowerCase().includes(q)
      const matchesFilter =
        filter === "all" ||
        (filter === "verified" && m.verificationStatus === "FULLY_VERIFIED") ||
        (filter === "pending" && ["PENDING_EMAIL", "EMAIL_VERIFIED", "PENDING_ID_REVIEW"].includes(m.verificationStatus)) ||
        (filter === "suspended" && m.verificationStatus === "SUSPENDED")
      return matchesQuery && matchesFilter
    })
  }, [members, query, filter])

  async function patch(id: string, body: Record<string, string>) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  ...(body.status ? { verificationStatus: body.status } : {}),
                  ...(body.tier ? { subscription: { tier: body.tier } } : {}),
                }
              : m
          )
        )
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  const filters = [
    { key: "all", label: "All" },
    { key: "verified", label: "Verified" },
    { key: "pending", label: "Pending" },
    { key: "suspended", label: "Suspended" },
  ]

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PageHeader title="Members" subtitle="The full member directory. Verify, suspend, or override subscription tiers." />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or organisation…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40"
          />
        </div>
        <div className="flex gap-1 bg-surface border border-[var(--border)] rounded-xl p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === f.key ? "bg-[var(--navy)] text-white" : "text-neutral-dark hover:bg-neutral-light"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-neutral border-b border-[var(--border)]">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Organisation</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Tier</th>
                <th className="px-5 py-3 font-semibold">Trust</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--background)]/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {m.avatarInitials}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--navy)] truncate">{m.fullName}</div>
                        <div className="text-xs text-neutral truncate">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-neutral-dark">
                    <div>{m.organisation ?? "—"}</div>
                    <div className="text-xs text-neutral">{m.dutyStation ?? ""}</div>
                  </td>
                  <td className="px-5 py-3"><VerificationBadge status={m.verificationStatus} /></td>
                  <td className="px-5 py-3">
                    <TierSelect
                      value={m.subscription?.tier ?? ""}
                      disabled={busyId === m.id}
                      onChange={(tier) => patch(m.id, { tier })}
                    />
                  </td>
                  <td className="px-5 py-3">
                    {m.trustScore != null ? (
                      <span className="inline-flex items-center gap-1 text-[var(--navy)] font-semibold">
                        <Star size={13} className="text-[var(--gold)] fill-[var(--gold)]" /> {m.trustScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-neutral text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {m.verificationStatus !== "FULLY_VERIFIED" && (
                        <button
                          onClick={() => patch(m.id, { status: "FULLY_VERIFIED" })}
                          disabled={busyId === m.id}
                          title="Verify"
                          className="p-1.5 rounded-lg text-[var(--teal)] hover:bg-[var(--teal)]/10 disabled:opacity-50"
                        >
                          <ShieldCheck size={16} />
                        </button>
                      )}
                      {m.verificationStatus !== "SUSPENDED" ? (
                        <button
                          onClick={() => patch(m.id, { status: "SUSPENDED" })}
                          disabled={busyId === m.id}
                          title="Suspend"
                          className="p-1.5 rounded-lg text-[var(--crimson)] hover:bg-[var(--crimson)]/10 disabled:opacity-50"
                        >
                          <Ban size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => patch(m.id, { status: "FULLY_VERIFIED" })}
                          disabled={busyId === m.id}
                          className="text-xs font-semibold text-[var(--teal)] hover:underline disabled:opacity-50"
                        >
                          Reinstate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral text-sm">No members match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-neutral mt-3">{filtered.length} of {members.length} members</p>
    </div>
  )
}

function TierSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="appearance-none pl-2.5 pr-7 py-1 rounded-lg border border-[var(--border)] bg-surface text-xs font-semibold text-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 disabled:opacity-50"
      >
        <option value="">No plan</option>
        {Object.entries(TIER_LABELS).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral pointer-events-none" />
    </div>
  )
}
