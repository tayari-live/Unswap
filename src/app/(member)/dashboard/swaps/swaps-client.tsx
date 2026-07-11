"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Calendar, Users, Check, X, Repeat, CheckCheck } from "lucide-react"
import { MessageButton } from "../messages/message-button"
import { useToast } from "@/components/ui/toast"

const ACTION_MSG: Record<string, string> = {
  accept: "Swap accepted",
  accept_counter: "Exchange confirmed",
  decline: "Request declined",
  counter: "Counter-offer sent",
  cancel: "Request cancelled",
  complete: "Marked as completed",
}

type Party = { id: string; fullName: string; avatarInitials: string; organisation: string | null }
export type SwapRow = {
  id: string
  status: string
  mode: string
  startDate: string
  endDate: string
  guests: number
  message: string | null
  listing: { title: string; city: string; country: string }
  requester: Party
  host: Party
}

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "bg-[var(--gold)]/15 text-[var(--gold-dark)]",
  COUNTER_OFFERED: "bg-[var(--gold)]/15 text-[var(--gold-dark)]",
  CONFIRMED: "bg-[var(--teal)]/15 text-[var(--teal)]",
  IN_PROGRESS: "bg-[var(--teal)]/15 text-[var(--teal)]",
  COMPLETED: "bg-neutral-light text-neutral-dark",
  CANCELLED: "bg-neutral-light text-neutral",
}

function fmt(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d))
}

function SwapCard({ swap, role }: { swap: SwapRow; role: "incoming" | "outgoing" | "past" }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [countering, setCountering] = useState(false)
  const [cStart, setCStart] = useState(swap.startDate.slice(0, 10))
  const [cEnd, setCEnd] = useState(swap.endDate.slice(0, 10))

  const other = role === "incoming" ? swap.requester : swap.host

  async function act(action: string, extra?: Record<string, unknown>) {
    setBusy(true)
    try {
      const res = await fetch(`/api/swaps/${swap.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast(d.error || "Action failed.", "error")
      } else {
        toast(ACTION_MSG[action] ?? "Done", "success")
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  const btn = "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"

  return (
    <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-xs font-bold">
            {other.avatarInitials}
          </span>
          <div>
            <div className="text-sm font-semibold text-[var(--navy)]">{other.fullName}</div>
            <div className="text-xs text-neutral">
              {role === "incoming" ? "wants to stay at" : "your request for"}{" "}
              <span className="font-medium">{swap.listing.title}</span>
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_STYLE[swap.status] ?? STATUS_STYLE.REQUESTED}`}>
          {swap.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral">
        <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {swap.listing.city}, {swap.listing.country}</span>
        <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {fmt(swap.startDate)} – {fmt(swap.endDate)}</span>
        <span className="inline-flex items-center gap-1.5"><Users size={13} /> {swap.guests} {swap.guests === 1 ? "guest" : "guests"}</span>
        <span className="inline-flex items-center gap-1.5"><Repeat size={13} /> {swap.mode}</span>
      </div>

      {swap.message && <p className="mt-3 text-sm text-neutral-dark bg-[var(--background)] rounded-lg p-3">“{swap.message}”</p>}

      {countering && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <input type="date" value={cStart} onChange={(e) => setCStart(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm" />
          <input type="date" value={cEnd} onChange={(e) => setCEnd(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm" />
          <button disabled={busy} onClick={() => act("counter", { startDate: cStart, endDate: cEnd })} className={`${btn} text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)]`}>Send counter</button>
          <button onClick={() => setCountering(false)} className={`${btn} text-neutral bg-neutral-light`}>Cancel</button>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap gap-2">
        {role === "incoming" && swap.status === "REQUESTED" && !countering && (
          <>
            <button disabled={busy} onClick={() => act("accept")} className={`${btn} text-white bg-[var(--teal)] hover:opacity-90`}><Check size={14} /> Accept</button>
            <button disabled={busy} onClick={() => setCountering(true)} className={`${btn} text-[var(--gold-dark)] bg-[var(--gold)]/15 hover:bg-[var(--gold)]/25`}><Repeat size={14} /> Counter</button>
            <button disabled={busy} onClick={() => act("decline")} className={`${btn} text-[var(--crimson)] bg-[var(--crimson)]/10 hover:bg-[var(--crimson)]/20`}><X size={14} /> Decline</button>
          </>
        )}
        {role === "incoming" && swap.status === "COUNTER_OFFERED" && (
          <span className="text-xs text-neutral">Counter-offer sent — awaiting their response.</span>
        )}
        {role === "outgoing" && swap.status === "REQUESTED" && (
          <button disabled={busy} onClick={() => act("cancel")} className={`${btn} text-[var(--crimson)] bg-[var(--crimson)]/10 hover:bg-[var(--crimson)]/20`}><X size={14} /> Cancel request</button>
        )}
        {role === "outgoing" && swap.status === "COUNTER_OFFERED" && (
          <>
            <button disabled={busy} onClick={() => act("accept_counter")} className={`${btn} text-white bg-[var(--teal)] hover:opacity-90`}><Check size={14} /> Accept new dates</button>
            <button disabled={busy} onClick={() => act("cancel")} className={`${btn} text-[var(--crimson)] bg-[var(--crimson)]/10 hover:bg-[var(--crimson)]/20`}><X size={14} /> Cancel</button>
          </>
        )}
        {swap.status === "CONFIRMED" && (
          <button disabled={busy} onClick={() => act("complete")} className={`${btn} text-[var(--navy)] bg-neutral-light hover:bg-[var(--border)]`}><CheckCheck size={14} /> Mark completed</button>
        )}
        {role !== "past" && (
          <MessageButton
            otherUserId={other.id}
            swapRequestId={swap.id}
            label="Message"
            className={`${btn} text-[var(--navy)] bg-neutral-light hover:bg-[var(--border)]`}
          />
        )}
      </div>
    </div>
  )
}

export function SwapsClient({
  incoming,
  outgoing,
  past,
}: {
  incoming: SwapRow[]
  outgoing: SwapRow[]
  past: SwapRow[]
}) {
  const [tab, setTab] = useState<"incoming" | "outgoing" | "past">("incoming")
  const data = { incoming, outgoing, past }[tab]
  const role = tab

  const tabBtn = (key: typeof tab, label: string, count: number) => (
    <button
      onClick={() => setTab(key)}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
        tab === key ? "bg-[var(--navy)] text-white" : "text-neutral-dark hover:bg-neutral-light"
      }`}
    >
      {label} {count > 0 && <span className={tab === key ? "text-[var(--gold)]" : "text-neutral"}>({count})</span>}
    </button>
  )

  return (
    <>
      <div className="flex gap-2 mb-6">
        {tabBtn("incoming", "Incoming", incoming.length)}
        {tabBtn("outgoing", "Outgoing", outgoing.length)}
        {tabBtn("past", "Past", past.length)}
      </div>

      {data.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-12 text-center">
          <p className="text-sm text-neutral">
            {tab === "incoming" && "No incoming requests right now."}
            {tab === "outgoing" && "You haven't sent any swap requests yet."}
            {tab === "past" && "No past exchanges yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((s) => <SwapCard key={s.id} swap={s} role={role} />)}
        </div>
      )}
    </>
  )
}
