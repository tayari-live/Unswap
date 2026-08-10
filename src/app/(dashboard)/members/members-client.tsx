"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ShieldCheck, Ban, Star, ChevronDown } from "lucide-react"
import { LuxPageHeader } from "@/components/ui/lux"
import { VerificationBadge } from "@/components/ui/badges"
import { AvatarInitials } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { AdminTable } from "@/components/ui/table"

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

export default function MembersClient({
  initialMembers,
  initialQuery = "",
}: {
  initialMembers: Member[]
  initialQuery?: string
}) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState("all")
  const [busyId, setBusyId] = useState<string | null>(null)

  // A same-route client navigation (e.g. from the top bar's global search,
  // clicking a member result while already on this page) reuses this mounted
  // instance, so `useState(initialQuery)` won't re-run — sync it explicitly.
  useEffect(() => {
    if (initialQuery) setQuery(initialQuery)
  }, [initialQuery])

  // Re-sync with the server after router.refresh() so rows never go stale.
  useEffect(() => {
    setMembers(initialMembers)
  }, [initialMembers])

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
      <LuxPageHeader eyebrow="Directory" title="Members" subtitle="The full member directory. Verify, suspend, or override subscription tiers." />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or organisation…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--hair)] bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40"
          />
        </div>
        <FilterTabs options={filters} value={filter} onChange={setFilter} />
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <AdminTable
          head={
            <>
              <th className="px-5 py-3 font-semibold">Member</th>
              <th className="px-5 py-3 font-semibold">Organisation</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Tier</th>
              <th className="px-5 py-3 font-semibold">Trust</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </>
          }
        >
          {filtered.map((m) => (
            <tr key={m.id} className="hover:bg-[var(--parchment)]">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <AvatarInitials initials={m.avatarInitials} />
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--fg)] truncate">{m.fullName}</div>
                    <div className="text-xs text-neutral truncate">{m.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 text-neutral-dark">
                <div>{m.organisation ?? "—"}</div>
                <div className="text-xs text-neutral">{m.dutyStation ?? ""}</div>
              </td>
              <td className="px-5 py-3.5"><VerificationBadge status={m.verificationStatus} /></td>
              <td className="px-5 py-3.5">
                <TierSelect
                  value={m.subscription?.tier ?? ""}
                  disabled={busyId === m.id}
                  onChange={(tier) => patch(m.id, { tier })}
                />
              </td>
              <td className="px-5 py-3.5"><TrustScore value={m.trustScore} /></td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-2">
                  <MemberActions m={m} busy={busyId === m.id} onPatch={patch} />
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6}><EmptyState bare description="No members match your search." /></td>
            </tr>
          )}
        </AdminTable>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((m) => (
          <MemberRowCard key={m.id} m={m} busy={busyId === m.id} onPatch={patch} />
        ))}
        {filtered.length === 0 && <EmptyState bare description="No members match your search." />}
      </div>

      <p className="text-xs text-neutral mt-3">{filtered.length} of {members.length} members</p>
    </div>
  )
}

function TrustScore({ value }: { value: number | null }) {
  if (value == null) return <span className="text-neutral text-xs">—</span>
  return (
    <span className="inline-flex items-center gap-1 text-[var(--fg)] font-semibold">
      <Star size={13} className="text-[var(--gold)] fill-[var(--gold)]" /> {value.toFixed(1)}
    </span>
  )
}

// Verify/suspend/reinstate actions, shared between the desktop row and the
// mobile card so the confirm-dialog logic lives in exactly one place.
function MemberActions({
  m,
  busy,
  onPatch,
}: {
  m: Member
  busy: boolean
  onPatch: (id: string, body: Record<string, string>) => void
}) {
  return (
    <>
      {m.verificationStatus !== "FULLY_VERIFIED" && (
        <button
          onClick={() => {
            // Verifying grants full network access — confirm to prevent an
            // accidental one-click approval.
            if (window.confirm(`Mark ${m.fullName} as fully verified?`)) {
              onPatch(m.id, { status: "FULLY_VERIFIED" })
            }
          }}
          disabled={busy}
          title="Verify"
          className="p-1.5 rounded-lg text-[var(--teal)] hover:bg-[var(--teal)]/10 disabled:opacity-50"
        >
          <ShieldCheck size={16} />
        </button>
      )}
      {m.verificationStatus !== "SUSPENDED" ? (
        <button
          onClick={() => {
            if (window.confirm(`Suspend ${m.fullName}? They will lose access to the network.`)) {
              onPatch(m.id, { status: "SUSPENDED" })
            }
          }}
          disabled={busy}
          title="Suspend"
          className="p-1.5 rounded-lg text-[var(--crimson)] hover:bg-[var(--crimson)]/10 disabled:opacity-50"
        >
          <Ban size={16} />
        </button>
      ) : (
        <button
          onClick={() => {
            if (window.confirm(`Reinstate ${m.fullName} as fully verified?`)) {
              onPatch(m.id, { status: "FULLY_VERIFIED" })
            }
          }}
          disabled={busy}
          className="text-xs font-semibold text-[var(--teal)] hover:underline disabled:opacity-50"
        >
          Reinstate
        </button>
      )}
    </>
  )
}

function MemberRowCard({
  m,
  busy,
  onPatch,
}: {
  m: Member
  busy: boolean
  onPatch: (id: string, body: Record<string, string>) => void
}) {
  return (
    <div className="bg-surface rounded-md border border-[var(--navy)]/10 p-4">
      <div className="flex items-center gap-3">
        <AvatarInitials initials={m.avatarInitials} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[var(--fg)] truncate">{m.fullName}</div>
          <div className="text-xs text-neutral truncate">{m.email}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <VerificationBadge status={m.verificationStatus} />
        <TrustScore value={m.trustScore} />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
        <div>
          <div className="text-neutral">Organisation</div>
          <div className="text-neutral-dark font-medium truncate">{m.organisation ?? "—"}</div>
        </div>
        <div>
          <div className="text-neutral">Duty station</div>
          <div className="text-neutral-dark font-medium truncate">{m.dutyStation ?? "—"}</div>
        </div>
      </div>
      <div className="mt-3">
        <TierSelect
          value={m.subscription?.tier ?? ""}
          disabled={busy}
          onChange={(tier) => onPatch(m.id, { tier })}
        />
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--hair)]">
        <MemberActions m={m} busy={busy} onPatch={onPatch} />
      </div>
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
        className="appearance-none pl-2.5 pr-7 py-1 rounded-lg border border-[var(--hair)] bg-surface text-xs font-semibold text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 disabled:opacity-50"
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
