"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, X, Check, FileText, Mail, MapPin, Building2 } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badges"
import { useToast } from "@/components/ui/toast"

type Submission = {
  id: string
  type: string
  idCardUrl: string | null
  proofUrl: string | null
  createdAt: string
  member: {
    fullName: string
    email: string
    organisation: string | null
    nationality: string | null
    dutyStation: string | null
    avatarInitials: string
    profileCompletion: number
  }
}

export default function VerificationClient({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const router = useRouter()
  const toast = useToast()
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [selected, setSelected] = useState<Submission | null>(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  function open(s: Submission) {
    setSelected(s)
    setNote("")
  }

  async function review(action: "approve" | "reject") {
    if (!selected) return
    if (action === "reject" && note.trim().length < 3) {
      toast("A rejection note is required.", "error")
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/verification/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Something went wrong.", "error")
        setBusy(false)
        return
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== selected.id))
      setSelected(null)
      toast(action === "approve" ? "Member approved." : "Submission rejected.", "success")
      router.refresh()
    } catch {
      toast("Network error. Please try again.", "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Verification Queue"
        subtitle="Review professional-status submissions. Approve to grant full network access."
        action={<Badge tone="gold">{submissions.length} pending</Badge>}
      />

      {submissions.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-12 text-center">
          <ShieldCheck className="mx-auto text-[var(--teal)] mb-3" size={40} />
          <p className="font-display font-bold text-lg text-[var(--navy)]">Queue is clear</p>
          <p className="text-sm text-neutral mt-1">No submissions are awaiting review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {submissions.map((s) => (
            <button
              key={s.id}
              onClick={() => open(s)}
              className="text-left bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5 hover:border-[var(--gold)] hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center font-bold">
                    {s.member.avatarInitials}
                  </span>
                  <div>
                    <div className="font-semibold text-[var(--navy)]">{s.member.fullName}</div>
                    <div className="text-xs text-neutral">{s.member.email}</div>
                  </div>
                </div>
                <Badge tone={s.type === "fast_track" ? "teal" : "navy"}>
                  {s.type === "fast_track" ? "Fast track" : "Manual"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-neutral-dark">
                <span className="flex items-center gap-1"><Building2 size={13} /> {s.member.organisation ?? "—"}</span>
                <span className="flex items-center gap-1"><MapPin size={13} /> {s.member.dutyStation ?? "—"}</span>
                <span className="flex items-center gap-1"><FileText size={13} /> Profile {s.member.profileCompletion}%</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Review drawer/modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--navy)]/40" onClick={() => !busy && setSelected(null)}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-surface">
              <h2 className="font-display font-bold text-lg text-[var(--navy)]">Review Submission</h2>
              <button onClick={() => setSelected(null)} disabled={busy} className="text-neutral hover:text-[var(--navy)]">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center font-bold text-lg">
                  {selected.member.avatarInitials}
                </span>
                <div>
                  <div className="font-semibold text-[var(--navy)] text-lg">{selected.member.fullName}</div>
                  <div className="text-sm text-neutral flex items-center gap-1"><Mail size={13} /> {selected.member.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Organisation" value={selected.member.organisation} />
                <Field label="Duty Station" value={selected.member.dutyStation} />
                <Field label="Nationality" value={selected.member.nationality} />
                <Field label="Profile" value={`${selected.member.profileCompletion}% complete`} />
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral mb-2">Documents</div>
                <div className="grid grid-cols-2 gap-3">
                  <DocPreview label="Staff ID" url={selected.idCardUrl} />
                  <DocPreview label="Proof of employment" url={selected.proofUrl} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral mb-1.5 block">
                  Reviewer note {`(required to reject)`}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note for the audit trail / member email…"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => review("reject")}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--crimson)] text-[var(--crimson)] text-sm font-semibold hover:bg-[var(--crimson)]/10 transition disabled:opacity-50"
                >
                  <X size={16} /> Reject
                </button>
                <button
                  onClick={() => review("approve")}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--teal)] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  <Check size={16} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-neutral font-semibold">{label}</div>
      <div className="text-[var(--navy)] font-medium">{value ?? "—"}</div>
    </div>
  )
}

function DocPreview({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] h-28 flex items-center justify-center text-xs text-neutral">
        No {label.toLowerCase()}
      </div>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="rounded-xl border border-[var(--border)] h-28 w-full object-cover group-hover:opacity-90" />
      <span className="text-[10px] text-neutral mt-1 block">{label}</span>
    </a>
  )
}
