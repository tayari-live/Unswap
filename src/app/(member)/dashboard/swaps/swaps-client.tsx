"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Users } from "lucide-react"
import { useToast } from "@/components/ui/toast"

const STATUS_MSG: Record<string, string> = {
  cancel: "Request cancelled",
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

function fmt(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d))
}

function nights(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000))
}

function IncomingCard({ swap }: { swap: SwapRow }) {
  return (
    <div className="bg-white rounded-[10px] border border-[var(--hair)] shadow-sm overflow-hidden flex flex-col group">
      <div className="p-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--gold-dark)] mb-5">Incoming Request</div>
        
        <div className="flex items-center gap-3 mb-5">
          <span className="w-10 h-10 rounded-full bg-navy/5 text-navy flex items-center justify-center text-sm font-bold flex-shrink-0">
            {swap.requester.avatarInitials}
          </span>
          <div className="flex flex-col">
            <span className="font-sans text-[15px] font-bold text-navy">{swap.requester.fullName}</span>
            <span className="font-sans text-[13px] text-navy/60">{swap.requester.organisation || "UnSwap Member"}</span>
          </div>
        </div>

        <div className="font-sans text-[14px] text-navy/70 mb-1">wants to stay at</div>
        <h3 className="font-display text-[26px] font-bold text-navy leading-none mb-1">{swap.listing.title}</h3>
        <div className="font-sans text-[14px] text-navy/70 mb-5">{swap.listing.city}, {swap.listing.country}</div>

        <div className="flex flex-col gap-1.5 font-sans text-[14px] text-navy font-medium mb-6">
          <span className="flex items-center gap-2"><Calendar size={14} className="text-[var(--gold)]" /> {fmt(swap.startDate)} – {fmt(swap.endDate)}</span>
          <span className="flex items-center gap-2"><Users size={14} className="text-[var(--gold)]" /> {swap.guests} guests · {nights(swap.startDate, swap.endDate)} nights</span>
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-[var(--hair)] bg-[var(--parchment-dark)] flex items-center justify-between">
        <Link href={`/dashboard/swaps/${swap.id}`} className="w-full inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] text-navy bg-[var(--gold)] hover:bg-[var(--gold-dark)] px-5 py-3 rounded transition-colors shadow-sm">
          Review Request
        </Link>
      </div>
    </div>
  )
}

function OutgoingCard({ swap }: { swap: SwapRow }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function cancelRequest() {
    if (!confirm("Are you sure you want to cancel this request?")) return
    setBusy(true)
    try {
      const res = await fetch(`/api/swaps/${swap.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast(d.error || "Could not cancel.", "error")
      } else {
        toast("Request cancelled", "success")
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  const isPending = swap.status === "REQUESTED" || swap.status === "COUNTER_OFFERED"

  return (
    <div className="bg-white rounded-[10px] border border-[var(--hair)] shadow-sm overflow-hidden flex flex-col group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-navy/40">Outgoing Request</div>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full ${isPending ? "bg-[var(--gold)]/10 text-[var(--gold-dark)]" : "bg-navy/10 text-navy"}`}>
            {isPending && <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-dark)]" />}
            {swap.status.replace("_", " ")}
          </span>
        </div>

        <h3 className="font-display text-[26px] font-bold text-navy leading-none mb-1">{swap.listing.city || swap.listing.title}</h3>
        <div className="font-sans text-[14px] text-navy/70 mb-5">{swap.listing.country || "Destination"}</div>

        <div className="flex flex-col gap-1.5 font-sans text-[14px] text-navy font-medium mb-6">
          <span className="flex items-center gap-2"><Calendar size={14} className="text-navy/30" /> {fmt(swap.startDate)} – {fmt(swap.endDate)}</span>
          <span className="flex items-center gap-2"><Users size={14} className="text-navy/30" /> {nights(swap.startDate, swap.endDate)} nights</span>
        </div>

        <div className="pt-4 border-t border-[var(--hair)]">
          <div className="font-sans text-[13px] text-navy/60">Host: <span className="font-medium text-navy">{swap.host.fullName}</span></div>
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-[var(--hair)] bg-navy/[0.02] flex items-center gap-2">
        <Link href={`/dashboard/swaps/${swap.id}`} className="flex-1 inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] text-navy bg-white border border-navy/10 hover:bg-[var(--parchment)] px-4 py-2.5 rounded transition-colors shadow-sm">
          View Request
        </Link>
        {isPending && (
          <button disabled={busy} onClick={cancelRequest} className="inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] text-navy bg-transparent hover:bg-navy/5 px-4 py-2.5 rounded transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export function SwapsClient({
  incoming,
  outgoing,
}: {
  incoming: SwapRow[]
  outgoing: SwapRow[]
  past: SwapRow[] // Kept for prop compatibility but unused here, it moved to exchanges
}) {
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming")
  
  const incomingActive = incoming.filter(s => s.status === "REQUESTED" || s.status === "COUNTER_OFFERED")
  const outgoingActive = outgoing.filter(s => s.status === "REQUESTED" || s.status === "COUNTER_OFFERED")
  
  const data = tab === "incoming" ? incomingActive : outgoingActive

  const tabBtn = (key: typeof tab, label: string, count: number) => (
    <button
      onClick={() => setTab(key)}
      className={`px-5 py-2.5 text-[14px] font-sans font-bold transition-colors border-b-2 ${
        tab === key ? "border-[var(--gold)] text-navy" : "border-transparent text-navy/40 hover:text-navy/60"
      }`}
    >
      {label} {count > 0 && <span className={tab === key ? "text-[var(--gold-dark)]" : "text-navy/40"}>({count})</span>}
    </button>
  )

  return (
    <>
      <div className="flex gap-6 mb-8 border-b border-[var(--hair)]">
        {tabBtn("incoming", "Incoming", incomingActive.length)}
        {tabBtn("outgoing", "Outgoing", outgoingActive.length)}
      </div>

      {data.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--hair)] p-12 text-center max-w-2xl mx-auto shadow-sm">
          <p className="font-sans text-[15px] text-navy/70">
            {tab === "incoming" && "You have no pending incoming requests right now."}
            {tab === "outgoing" && "You haven't sent any swap requests yet."}
          </p>
          {tab === "outgoing" && (
            <Link href="/dashboard/browse" className="inline-block mt-4 text-[14px] font-medium text-[var(--gold-dark)] hover:text-navy transition-colors">
              Explore homes to find your next stay &rarr;
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tab === "incoming" 
            ? data.map((s) => <IncomingCard key={s.id} swap={s} />)
            : data.map((s) => <OutgoingCard key={s.id} swap={s} />)
          }
        </div>
      )}
    </>
  )
}
