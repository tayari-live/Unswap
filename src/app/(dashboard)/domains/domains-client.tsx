"use client"

import { useState } from "react"
import { Plus, Trash2, Globe, Zap } from "lucide-react"
import { LuxPageHeader } from "@/components/ui/lux"
import { Badge } from "@/components/ui/badges"
import { useToast } from "@/components/ui/toast"
import { AvatarInitials } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"

type Domain = { id: string; domain: string; label: string; fastTrack: boolean }

export default function DomainsClient({ initialDomains }: { initialDomains: Domain[] }) {
  const toast = useToast()
  const [domains, setDomains] = useState(initialDomains)
  const [domain, setDomain] = useState("")
  const [label, setLabel] = useState("")
  const [fastTrack, setFastTrack] = useState(true)
  const [busy, setBusy] = useState(false)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, label, fastTrack }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Could not add domain.", "error")
        return
      }
      setDomains((prev) => [...prev, data].sort((a, b) => a.domain.localeCompare(b.domain)))
      setDomain("")
      setLabel("")
      toast(`@${data.domain} added to the allowlist.`, "success")
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/domains/${id}`, { method: "DELETE" })
    if (res.ok) setDomains((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <LuxPageHeader eyebrow="Access"
        title="Domain Allowlist"
        subtitle="Institutional email domains that gate sign-up. Fast-track domains skip manual review."
      />

      <form onSubmit={add} className="bg-surface rounded-md border border-[var(--navy)]/10 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral mb-1.5 block" htmlFor="d-domain">Domain</label>
            <input
              id="d-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="un.org"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--hair)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral mb-1.5 block" htmlFor="d-org">Organisation</label>
            <input
              id="d-org"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="United Nations"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--hair)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center gap-2 text-sm text-neutral-dark cursor-pointer">
            <input type="checkbox" checked={fastTrack} onChange={(e) => setFastTrack(e.target.checked)} className="accent-[var(--navy)]" />
            Fast-track (skip manual review)
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--navy)] text-white text-sm font-semibold hover:bg-[var(--navy-light)] transition disabled:opacity-50"
          >
            <Plus size={16} /> Add domain
          </button>
        </div>
      </form>

      <div className="bg-surface rounded-md border border-[var(--navy)]/10 divide-y divide-[var(--hair)]">
        {domains.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--parchment)] transition-colors">
            <div className="flex items-center gap-3">
              <AvatarInitials icon={Globe} />
              <div>
                <div className="font-semibold text-[var(--fg)]">@{d.domain}</div>
                <div className="text-xs text-neutral">{d.label}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {d.fastTrack ? (
                <Badge tone="teal"><Zap size={11} /> Fast track</Badge>
              ) : (
                <Badge tone="gold">Manual</Badge>
              )}
              <button onClick={() => remove(d.id)} className="p-1.5 rounded-lg text-[var(--crimson)] hover:bg-[var(--crimson)]/10" title="Remove">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {domains.length === 0 && <p className="px-5 py-8 text-center text-sm text-neutral">No domains on the allowlist yet.</p>}
      </div>
    </div>
  )
}
