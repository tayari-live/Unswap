"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Send, CheckCircle2, Trophy, Upload, MailWarning, RefreshCw, Check } from "lucide-react"
import { LuxPageHeader } from "@/components/ui/lux"
import { StatusBadge } from "@/components/ui/badges"
import { useToast } from "@/components/ui/toast"
import { EmptyState } from "@/components/ui/empty-state"
import { AdminTable } from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"

type Entry = {
  id: string
  firstName: string
  lastName: string
  email: string
  organisation: string | null
  referralCode: string
  referrals: number
  status: string
  confirmedAt: string | null
  createdAt: string
}

export default function WaitlistClient({ initialEntries }: { initialEntries: Entry[] }) {
  const router = useRouter()
  const toast = useToast()
  const [entries, setEntries] = useState(initialEntries)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [resendAllBusy, setResendAllBusy] = useState(false)

  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [importBusy, setImportBusy] = useState(false)

  const pendingCount = entries.filter((e) => e.status === "pending").length
  const unconfirmedCount = entries.filter((e) => !e.confirmedAt).length

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

  async function resendOne(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/waitlist/${id}/resend`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) return toast(data.error || "Could not resend.", "error")
      toast(data.sent ? "Confirmation email sent." : "Queued (Kit not configured, link generated).", "success")
    } finally {
      setBusyId(null)
    }
  }

  async function resendAll() {
    if (!confirm(`Resend the confirmation email to all ${unconfirmedCount} unconfirmed people?`)) return
    setResendAllBusy(true)
    try {
      const res = await fetch("/api/waitlist/resend-all", { method: "POST" })
      const data = await res.json()
      if (!res.ok) return toast(data.error || "Could not resend.", "error")
      toast(`Resent to ${data.sent}/${data.total} unconfirmed.`, "success")
    } finally {
      setResendAllBusy(false)
    }
  }

  async function doImport() {
    if (!importText.trim()) return toast("Paste some rows or upload a CSV first.", "error")
    setImportBusy(true)
    try {
      const res = await fetch("/api/waitlist/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: importText }),
      })
      const data = await res.json()
      if (!res.ok) return toast(data.error || "Import failed.", "error")
      toast(`Imported ${data.imported} · skipped ${data.skipped} (duplicates) · invalid ${data.invalid}.`, "success")
      setImportOpen(false)
      setImportText("")
      router.refresh()
    } finally {
      setImportBusy(false)
    }
  }

  function onFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImportText(String(reader.result || ""))
    reader.readAsText(file)
  }

  function exportCsv() {
    const rows = [
      ["First name", "Last name", "Email", "Organisation", "Referral code", "Referrals", "Confirmed", "Status", "Joined"],
      ...entries.map((e) => [
        e.firstName, e.lastName, e.email, e.organisation ?? "", e.referralCode,
        String(e.referrals), e.confirmedAt ? "yes" : "no", e.status, new Date(e.createdAt).toISOString().slice(0, 10),
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
      <LuxPageHeader eyebrow="Pipeline"
        title="Waitlist"
        subtitle="Pre-launch signups with referral tracking. Import leads, resend confirmations, invite founders."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--hair)] bg-surface text-sm font-semibold text-[var(--fg)] hover:bg-neutral-light transition">
              <Upload size={16} /> Import leads
            </button>
            {unconfirmedCount > 0 && (
              <button onClick={resendAll} disabled={resendAllBusy} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--gold)] bg-surface text-sm font-semibold text-[var(--gold-dark)] hover:bg-[var(--parchment)] transition disabled:opacity-50">
                <MailWarning size={16} /> {resendAllBusy ? "Sending…" : `Resend unconfirmed (${unconfirmedCount})`}
              </button>
            )}
            {pendingCount > 0 && (
              <button onClick={inviteAll} disabled={bulkBusy} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--gold-dark)] text-sm font-semibold text-white hover:bg-[var(--gold-hover)] transition disabled:opacity-50">
                <Send size={16} /> {bulkBusy ? "Inviting…" : `Invite all (${pendingCount})`}
              </button>
            )}
            <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--hair)] bg-surface text-sm font-semibold text-[var(--fg)] hover:bg-neutral-light transition">
              <Download size={16} /> Export CSV
            </button>
          </div>
        }
      />

      {topReferrers.length > 0 && (
        <div className="bg-[var(--navy)] rounded-md p-5 mb-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-[var(--gold)]" />
            <h2 className="font-sans font-semibold">Top Referrers · 6 months Unlimited Pro free</h2>
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

      {/* Desktop: table */}
      <div className="hidden md:block">
        <AdminTable
          head={
            <>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Organisation</th>
              <th className="px-5 py-3 font-semibold">Referrals</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </>
          }
        >
          {entries.map((e) => (
            <tr key={e.id} className="hover:bg-[var(--parchment)]">
              <td className="px-5 py-3.5">
                <div className="font-semibold text-[var(--fg)]">{e.firstName} {e.lastName}</div>
                <div className="text-xs text-neutral">{e.email}</div>
              </td>
              <td className="px-5 py-3.5 text-neutral-dark">{e.organisation ?? "—"}</td>
              <td className="px-5 py-3.5 font-semibold text-[var(--fg)]">{e.referrals}</td>
              <td className="px-5 py-3.5"><ConfirmedTag confirmed={!!e.confirmedAt} /></td>
              <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-2">
                  <WaitlistActions e={e} busy={busyId === e.id} onResend={resendOne} onPatch={patch} />
                </div>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={6}><EmptyState bare description="No waitlist entries." /></td></tr>
          )}
        </AdminTable>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {entries.map((e) => (
          <WaitlistEntryCard key={e.id} e={e} busy={busyId === e.id} onResend={resendOne} onPatch={patch} />
        ))}
        {entries.length === 0 && <EmptyState bare description="No waitlist entries." />}
      </div>

      <Modal open={importOpen} onClose={() => !importBusy && setImportOpen(false)} busy={importBusy} title="Import leads" titleId="import-leads-title">
        <div className="space-y-4">
          <p className="text-sm text-neutral">
            Paste rows or upload a CSV with columns <strong>email, name, organisation</strong> (a header row is detected automatically). Imported as unconfirmed leads. Duplicates are skipped. Send them a confirmation with <em>Resend unconfirmed</em>.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            placeholder={"email,name,organisation\njane@un.org,Jane Doe,United Nations\njohn@who.int,John Smith,WHO"}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--hair)] bg-[var(--background)] text-sm font-mono text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40"
          />
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold-dark)] cursor-pointer hover:underline">
            <Upload size={15} /> Upload .csv
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setImportOpen(false)} disabled={importBusy} className="px-4 py-2.5 rounded-xl border border-[var(--hair)] text-sm font-semibold text-[var(--fg)] hover:bg-neutral-light transition">Cancel</button>
            <button onClick={doImport} disabled={importBusy} className="px-5 py-2.5 rounded-xl bg-[var(--gold-dark)] text-sm font-semibold text-white hover:bg-[var(--gold-hover)] transition disabled:opacity-50">
              {importBusy ? "Importing…" : "Import"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ConfirmedTag({ confirmed }: { confirmed: boolean }) {
  return confirmed ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--teal)]"><Check size={13} /> Confirmed</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold-dark)]"><MailWarning size={13} /> Not confirmed</span>
  )
}

// Resend/invite/convert actions, shared between the desktop row and the
// mobile card.
function WaitlistActions({
  e,
  busy,
  onResend,
  onPatch,
}: {
  e: Entry
  busy: boolean
  onResend: (id: string) => void
  onPatch: (id: string, status: string) => void
}) {
  return (
    <>
      {!e.confirmedAt && (
        <button
          onClick={() => onResend(e.id)}
          disabled={busy}
          title="Resend confirmation email"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--gold)] text-[var(--gold-dark)] hover:bg-[var(--parchment)] transition disabled:opacity-50"
        >
          <RefreshCw size={13} /> Resend
        </button>
      )}
      {e.status === "pending" && (
        <button
          onClick={() => onPatch(e.id, "invited")}
          disabled={busy}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-hover)] transition disabled:opacity-50"
        >
          <Send size={13} /> Invite
        </button>
      )}
      {e.status !== "converted" && (
        <button
          onClick={() => onPatch(e.id, "converted")}
          disabled={busy}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--teal)] text-[var(--teal)] hover:bg-[var(--teal)]/10 transition disabled:opacity-50"
        >
          <CheckCircle2 size={13} /> Convert
        </button>
      )}
    </>
  )
}

function WaitlistEntryCard({
  e,
  busy,
  onResend,
  onPatch,
}: {
  e: Entry
  busy: boolean
  onResend: (id: string) => void
  onPatch: (id: string, status: string) => void
}) {
  return (
    <div className="bg-surface rounded-md border border-[var(--navy)]/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-[var(--fg)] truncate">{e.firstName} {e.lastName}</div>
          <div className="text-xs text-neutral truncate">{e.email}</div>
        </div>
        <StatusBadge status={e.status} />
      </div>
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="text-neutral-dark">{e.organisation ?? "—"}</div>
        <div className="font-semibold text-[var(--fg)]">{e.referrals} referral{e.referrals === 1 ? "" : "s"}</div>
      </div>
      <div className="mt-2"><ConfirmedTag confirmed={!!e.confirmedAt} /></div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--hair)] flex-wrap">
        <WaitlistActions e={e} busy={busy} onResend={onResend} onPatch={onPatch} />
      </div>
    </div>
  )
}
