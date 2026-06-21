"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Trash2, MessageSquare, Star, ShieldX } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

export type ModReport = {
  id: string
  targetType: string
  reason: string | null
  createdAt: string
  reporter: { fullName: string; avatarInitials: string }
  content: { body: string; by: string; meta?: string; removed: boolean }
}

function fmt(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d))
}

export default function ModerationClient({ initial }: { initial: ModReport[] }) {
  const router = useRouter()
  const [reports, setReports] = useState(initial)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function resolve(id: string, action: "dismiss" | "remove") {
    if (action === "remove" && !confirm("Permanently remove this content?")) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id))
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <PageHeader title="Content Moderation" subtitle="Member-reported messages and reviews awaiting review." />

      {reports.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--teal)]/15 text-[var(--teal)] flex items-center justify-center mb-4">
            <ShieldX size={26} />
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">Queue is clear</h2>
          <p className="mt-2 text-sm text-neutral">No open reports to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[var(--gold)]/15 text-[var(--gold-dark)]">
                  {r.targetType === "message" ? <MessageSquare size={12} /> : <Star size={12} />}
                  {r.targetType}
                </span>
                <span className="text-xs text-neutral">Reported by {r.reporter.fullName} · {fmt(r.createdAt)}</span>
              </div>

              {r.reason && <p className="mt-3 text-xs text-neutral-dark"><span className="font-semibold">Reason:</span> {r.reason}</p>}

              <div className="mt-3 rounded-xl bg-[var(--background)] border border-[var(--border)] p-3">
                {r.content.removed ? (
                  <p className="text-sm text-neutral italic">This content has already been removed.</p>
                ) : (
                  <>
                    <div className="text-xs text-neutral mb-1">{r.content.by}{r.content.meta ? ` · ${r.content.meta}` : ""}</div>
                    <p className="text-sm text-[var(--navy)] whitespace-pre-wrap break-words">“{r.content.body}”</p>
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  disabled={busyId === r.id}
                  onClick={() => resolve(r.id, "dismiss")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--navy)] hover:bg-neutral-light disabled:opacity-50 transition-colors"
                >
                  <Check size={14} /> Dismiss
                </button>
                {!r.content.removed && (
                  <button
                    disabled={busyId === r.id}
                    onClick={() => resolve(r.id, "remove")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[var(--crimson)]/10 text-[var(--crimson)] hover:bg-[var(--crimson)]/20 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 size={14} /> Remove content
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
