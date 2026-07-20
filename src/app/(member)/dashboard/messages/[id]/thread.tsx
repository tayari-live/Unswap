"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Send, ImagePlus, X, BadgeCheck, Check, CheckCheck } from "lucide-react"
import { ReportButton } from "@/components/report-button"
import { useToast } from "@/components/ui/toast"

type Msg = { id: string; senderId: string; body: string; attachmentUrl: string | null; createdAt: string }
type Other = { id: string; fullName: string; avatarInitials: string; verificationStatus: string; organisation?: string | null } | null

const MAX_BYTES = 10 * 1024 * 1024

function clock(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
}

// Calendar-day key, so messages can be grouped under date separators.
function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// "Today" / "Yesterday" / "Mon 14 Jul 2025" for the separator chip.
function dayLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86_400_000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  }).format(d)
}

export function Thread({
  conversationId,
  currentUserId,
  other,
  initialMessages,
  swapRequest,
  initialOtherLastReadAt = null,
}: {
  conversationId: string
  currentUserId: string
  other: Other
  initialMessages: Msg[]
  swapRequest?: any
  initialOtherLastReadAt?: string | null
}) {
  const toast = useToast()
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [body, setBody] = useState("")
  const [attachment, setAttachment] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(initialOtherLastReadAt)
  const [otherTyping, setOtherTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastTypingPing = useRef(0)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
        setOtherLastReadAt(data.otherLastReadAt ?? null)
        setOtherTyping(!!data.otherTyping)
      }
    } catch {
      /* ignore transient poll errors */
    }
  }, [conversationId])

  // Cheap status poll (read receipts + typing) — runs faster than the message
  // poll so "typing…" and read ticks feel responsive without re-fetching bodies.
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/typing`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setOtherLastReadAt(data.otherLastReadAt ?? null)
        setOtherTyping(!!data.otherTyping)
      }
    } catch {
      /* ignore transient poll errors */
    }
  }, [conversationId])

  // Tell the other party we're typing — throttled to at most once every 3s.
  const pingTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingPing.current < 3000) return
    lastTypingPing.current = now
    fetch(`/api/conversations/${conversationId}/typing`, { method: "POST" }).catch(() => {})
  }, [conversationId])

  // Poll for new messages (4s) and status (2s).
  useEffect(() => {
    const m = setInterval(refresh, 4000)
    const s = setInterval(pollStatus, 2000)
    return () => { clearInterval(m); clearInterval(s) }
  }, [refresh, pollStatus])

  // Keep pinned to the latest message (and when the typing bubble appears).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, otherTyping])

  // My latest sent message that the other party has read → drives the ✓✓.
  const lastReadMine = (() => {
    if (!otherLastReadAt) return -1
    const readTs = new Date(otherLastReadAt).getTime()
    let idx = -1
    messages.forEach((m, i) => {
      if (m.senderId === currentUserId && new Date(m.createdAt).getTime() <= readTs) idx = i
    })
    return idx
  })()

  function pickFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) return toast("Attachments must be an image.", "error")
    if (file.size > MAX_BYTES) return toast("Image is over 10 MB.", "error")
    const reader = new FileReader()
    reader.onload = () => setAttachment(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function send(e?: React.FormEvent, presetBody?: string) {
    if (e) e.preventDefault()
    if (sending) return
    const finalBody = presetBody ?? body
    if (!finalBody.trim() && !attachment) return
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: finalBody, attachmentUrl: attachment }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast(d.error || "Could not send.", "error")
      } else {
        if (!presetBody) setBody("")
        setAttachment(null)
        await refresh()
      }
    } finally {
      setSending(false)
    }
  }

  // The trip right-pane details
  const hasTrip = !!swapRequest
  const listing = swapRequest?.listing
  const guests = swapRequest?.guests || 1
  const arrival = swapRequest?.startDate ? new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(new Date(swapRequest.startDate)) : "--"
  const departure = swapRequest?.endDate ? new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(new Date(swapRequest.endDate)) : "--"
  // SwapRequest.mode is "simultaneous" | "credits".
  const exchangeType = swapRequest?.mode === "credits" ? "Credits" : "Simultaneous"
  // Human-readable swap stage for the header chip.
  const SWAP_STAGE: Record<string, string> = {
    REQUESTED: "Requested",
    COUNTER_OFFERED: "Counter-offered",
    ACCEPTED: "Accepted",
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  }
  const swapStage = swapRequest?.status ? SWAP_STAGE[swapRequest.status] ?? swapRequest.status : null

  return (
    <div className="flex w-full h-full">
      {/* Middle Pane - Chat Thread */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header — who you're talking to, and the swap stage if one is linked */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] bg-white sticky top-0 z-10 text-sm">
          <Link href="/dashboard/messages" className="md:hidden text-neutral hover:text-[var(--navy)] mr-2">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-8 h-8 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-xs font-bold flex-shrink-0">
            {other?.avatarInitials ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[var(--navy)] truncate leading-tight">{other?.fullName ?? "Member"}</div>
            {otherTyping ? (
              <div className="text-[11px] text-[var(--teal)] font-semibold truncate">typing…</div>
            ) : other?.organisation ? (
              <div className="text-[11px] text-neutral truncate">{other.organisation}</div>
            ) : null}
          </div>
          {swapStage && (
            <span className="ml-auto flex-shrink-0 text-[10px] font-bold uppercase tracking-wide bg-[var(--gold)]/15 text-[var(--gold-dark)] px-2.5 py-1 rounded-full">
              Swap · {swapStage}
            </span>
          )}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#faf9f6]">
          {messages.length === 0 && (
            <p className="text-center text-sm text-neutral py-10">No messages yet. Say hello.</p>
          )}

          {/* Scammer Warning (placed at top of thread) */}
          <div className="max-w-xl mx-auto mb-8 text-center bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-[var(--crimson)] font-bold text-sm mb-2">
              <BadgeCheck size={16} />
              Tips to avoid scammers
            </div>
            <p className="text-xs text-neutral leading-relaxed">
              Never pay a deposit or upfront fee. Only settle agreed charges once your stay begins. Whenever possible, keep your conversations on UnSwap and share only essential information.
            </p>
          </div>

          <div className="space-y-4">
            {messages.map((m, i) => {
              const mine = m.senderId === currentUserId
              // Show a date chip whenever the calendar day changes.
              const newDay = i === 0 || dayKey(m.createdAt) !== dayKey(messages[i - 1].createdAt)
              return (
                <div key={m.id}>
                  {newDay && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] font-semibold text-neutral bg-white border border-[var(--border)] rounded-full px-3 py-1 shadow-sm">
                        {dayLabel(m.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && (
                    <div className="w-8 h-8 rounded-full bg-white border border-[var(--border)] text-[var(--navy)] flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0 mb-1">
                      {other?.avatarInitials ?? "?"}
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-[#f4efe8] text-[var(--navy)] rounded-br-sm" : "bg-white border border-[var(--border)] text-[var(--navy)] rounded-bl-sm"}`}>
                    {m.attachmentUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.attachmentUrl} alt="attachment" className="rounded-lg mb-2 max-h-60 object-cover" />
                    )}
                    {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                    <div className={`text-[10px] mt-1.5 text-neutral/70 font-medium flex items-center gap-1 ${mine ? "justify-end" : ""}`}>
                      <span>{mine ? "You" : other?.fullName?.split(" ")[0] || "Member"} • {clock(m.createdAt)}</span>
                      {mine && (
                        i <= lastReadMine ? (
                          <CheckCheck size={13} className="text-[var(--teal)]" aria-label="Read" />
                        ) : (
                          <Check size={13} className="text-neutral/50" aria-label="Sent" />
                        )
                      )}
                    </div>
                  </div>
                  {!mine && <div className="mb-1"><ReportButton targetType="message" targetId={m.id} /></div>}
                  </div>
                </div>
              )
            })}

            {otherTyping && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-white border border-[var(--border)] text-[var(--navy)] flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0 mb-1">
                  {other?.avatarInitials ?? "?"}
                </div>
                <div className="bg-white border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <span className="flex items-center gap-1" aria-label={`${other?.fullName?.split(" ")[0] || "Member"} is typing`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral/50 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral/50 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral/50 animate-bounce" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer Area */}
        <div className="bg-white border-t border-[var(--border)] p-4 relative z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          {/* Quick Responses */}
          <div className="flex items-center gap-0 overflow-x-auto pb-3 mb-1 no-scrollbar border-b border-[var(--border)] text-sm font-semibold text-[var(--navy)]">
            <span className="px-3 whitespace-nowrap text-neutral">Quick response</span>
            <button onClick={() => send(undefined, "Yes, that sounds great!")} className="px-4 py-1 hover:text-[var(--gold-dark)] transition-colors border-l border-[var(--border)]">Yes</button>
            <button onClick={() => send(undefined, "Maybe, let me check my calendar.")} className="px-4 py-1 hover:text-[var(--gold-dark)] transition-colors border-l border-[var(--border)]">Maybe</button>
            <button onClick={() => send(undefined, "No, sorry we are not available then.")} className="px-4 py-1 hover:text-[var(--gold-dark)] transition-colors border-l border-[var(--border)]">No</button>
          </div>

          <form onSubmit={(e) => send(e)} className="pt-3">
            {attachment && (
              <div className="relative inline-block mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachment} alt="preview" className="h-20 rounded-lg border border-[var(--border)]" />
                <button type="button" onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-[var(--border)] text-[var(--navy)] flex items-center justify-center shadow">
                  <X size={13} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={body}
                onChange={(e) => { setBody(e.target.value); if (e.target.value.trim()) pingTyping() }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e) } }}
                rows={1}
                placeholder="Write your response here..."
                className="flex-1 resize-none px-0 py-3 bg-transparent text-sm text-[var(--navy)] placeholder-neutral focus:outline-none"
              />
              <label className="flex-shrink-0 p-3 text-neutral hover:text-[var(--navy)] cursor-pointer transition-colors">
                <ImagePlus size={20} />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
              </label>
              <button
                type="submit"
                disabled={sending || (!body.trim() && !attachment)}
                className="flex-shrink-0 px-4 py-2 font-bold text-[var(--gold-dark)] hover:text-[var(--gold-hover)] disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Pane - Trip Details (Hidden on small screens) */}
      <div className="hidden lg:flex w-80 xl:w-96 flex-col border-l border-[var(--border)] bg-white flex-shrink-0 h-full overflow-y-auto">
        <div className="p-4 border-b border-[var(--border)] font-bold text-[var(--navy)] text-center text-sm sticky top-0 bg-white z-10">
          {other?.fullName?.split(" ")[0] ? `${other.fullName.split(" ")[0]}'s trip` : "Trip details"}
        </div>
        
        {hasTrip ? (
          <div className="p-5">
            {listing?.primaryPhotoUrl ? (
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={listing.primaryPhotoUrl} alt="Listing" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-[var(--parchment)] mb-4 flex items-center justify-center border border-[var(--border)]">
                <span className="text-neutral text-sm font-medium">No image</span>
              </div>
            )}

            <h3 className="font-display font-bold text-[var(--navy)] text-lg leading-tight truncate">
              {listing?.title || "Listing"}
            </h3>
            <p className="text-xs text-neutral mt-1 mb-5 truncate">{listing?.city ? `${listing.city}, ${listing.country}` : "Location unknown"}</p>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <div>
                <div className="text-[10px] text-neutral uppercase tracking-wider font-semibold mb-1">Guests</div>
                <div className="font-bold text-[var(--navy)] text-lg">{guests}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral uppercase tracking-wider font-semibold mb-1">Arrival</div>
                <div className="font-bold text-[var(--navy)] text-sm">{arrival}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral uppercase tracking-wider font-semibold mb-1">Departure</div>
                <div className="font-bold text-[var(--navy)] text-sm">{departure}</div>
              </div>
            </div>

            <div className="py-3 border-t border-[var(--border)] mb-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral">Exchange type</span>
                <span className="font-bold text-sm text-[var(--navy)]">{exchangeType}</span>
              </div>
              {swapStage && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral">Status</span>
                  <span className="font-bold text-sm text-[var(--navy)]">{swapStage}</span>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/swaps"
              className="block w-full py-3.5 px-4 rounded-xl text-sm font-bold text-center text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] transition-colors shadow-sm"
            >
              View swap request
            </Link>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-neutral flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white border border-[var(--border)] shadow-sm text-[var(--navy)] flex items-center justify-center text-2xl font-bold mb-4 overflow-hidden">
              {other?.avatarInitials ?? "?"}
            </div>
            <h3 className="font-display font-bold text-[var(--navy)] text-lg mb-1">{other?.fullName || "Member"}</h3>
            <p className="text-xs text-neutral/80 uppercase tracking-wider font-semibold mb-6">
              {other?.organisation ? `${other.organisation} member` : "Verified member"}
            </p>
            <p className="text-xs leading-relaxed">
              This conversation is not linked to a specific swap request. Start a swap request from a listing to see trip details here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
