"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Send, CheckCircle2, Trophy } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge } from "@/components/ui/badges"

type Entry = {
  id: string
  firstName: string
  lastName: string
  email: string
  organisation: string | null
  referralCode: string
  referrals: number
  status: string
  createdAt: string
}

export default function WaitlistClient({ initialEntries }: { initialEntries: Entry[] }) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  const pendingCount = entries.filter((e) => e.status === "pending").length

  async function inviteAll() {
    if (!confirm(`Invite all ${pendingCount} pending members?`)) return
    setBulkBusy(true)
    try {
      const res = await fetch("/api/waitlist/invite-all", { method: "POST" })
      if (res.ok) {
        setEntries((prev) => prev.map((e) => (e.status === "pending" ? { ...e, status: "invited" } : e)))
        router.refresh()
      }
    } finally {
      setBulkBusy(false)
    }
  }

  async function patch(id: string, status: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  function exportCsv() {
    const rows = [
      ["First name", "Last name", "Email", "Organisation", "Referral code", "Referrals", "Status", "Joined"],
      ...entries.map((e) => [
        e.firstName, e.lastName, e.email, e.organisation ?? "", e.referralCode,
        String(e.referrals), e.status, new Date(e.createdAt).toISOString().slice(0, 10),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "unswap-waitlist.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const topReferrers = [...entries].filter((e) => e.referrals >= 5).slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Waitlist"
        subtitle="Pre-launch signups with referral tracking. Invite founders and convert them to members."
        action={
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button onClick={inviteAll} disabled={bulkBusy} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--gold-dark)] text-sm font-semibold text-white hover:bg-[var(--gold-hover)] transition disabled:opacity-50">
                <Send size={16} /> {bulkBusy ? "Inviting…" : `Invite all (${pendingCount})`}
              </button>
            )}
            <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-surface text-sm font-semibold text-[var(--navy)] hover:bg-neutral-light transition">
              <Download size={16} /> Export CSV
            </button>
          </div>
        }
      />

      {topReferrers.length > 0 && (
        <div className="bg-[var(--navy)] rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-[var(--gold)]" />
            <h2 className="font-display font-bold">Top Referrers · 6 months Unlimited Pro free</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {topReferrers.map((e) => (
              <div key={e.id} className="bg-white/10 rounded-xl px-3 py-2">
                <div className="text-sm font-semibold">{e.firstName} {e.lastName}</div>
                <div className="text-xs text-[var(--gold)]">{e.referrals} referrals</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-neutral border-b border-[var(--border)]">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Organisation</th>
                <th className="px-5 py-3 font-semibold">Referrals</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-[var(--background)]/60">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-[var(--navy)]">{e.firstName} {e.lastName}</div>
                    <div className="text-xs text-neutral">{e.email}</div>
                  </td>
                  <td className="px-5 py-3 text-neutral-dark">{e.organisation ?? "—"}</td>
                  <td className="px-5 py-3 font-semibold text-[var(--navy)]">{e.referrals}</td>
                  <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {e.status === "pending" && (
                        <button
                          onClick={() => patch(e.id, "invited")}
                          disabled={busyId === e.id}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-hover)] transition disabled:opacity-50"
                        >
                          <Send size={13} /> Invite
                        </button>
                      )}
                      {e.status !== "converted" && (
                        <button
                          onClick={() => patch(e.id, "converted")}
                          disabled={busyId === e.id}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--teal)] text-[var(--teal)] hover:bg-[var(--teal)]/10 transition disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} /> Convert
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral text-sm">No waitlist entries.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
