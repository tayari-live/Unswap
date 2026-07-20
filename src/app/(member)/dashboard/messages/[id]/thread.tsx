"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Send, Paperclip, X, BadgeCheck, Check, CheckCheck, FileText, ChevronDown } from "lucide-react"
import { ReportButton } from "@/components/report-button"
import { useToast } from "@/components/ui/toast"

type Msg = { id: string; senderId: string; body: string; attachmentUrl: string | null; createdAt: string }
type Other = { id: string; fullName: string; avatarInitials: string; verificationStatus: string; organisation?: string | null } | null

const MAX_BYTES = 10 * 1024 * 1024
// Attachment types accepted by the composer (mirrors the server allowlist).
const ATTACH_ACCEPT = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
const ATTACH_DOC_TYPES = new Set([
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
])

const isImageData = (url: string) => url.startsWith("data:image/")
// Human label for a non-image attachment, derived from its data-URL mime.
function fileKind(url: string) {
  if (url.startsWith("data:application/pdf")) return "PDF document"
  if (url.includes("word")) return "Word document"
  if (url.includes("spreadsheet") || url.includes("excel") || url.startsWith("data:text/csv")) return "Spreadsheet"
  if (url.includes("presentation") || url.includes("powerpoint")) return "Presentation"
  if (url.startsWith("data:text/")) return "Text file"
  return "Attachment"
}

function clock(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
}

// "last seen today at 14:30" / "…yesterday at 14:30" / "…on 12 Jul".
function lastSeenLabel(iso: string | null) {
  if (!iso) return "Offline"
  const d = new Date(iso)
  const now = new Date()
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000,
  )
  const t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d)
  if (days === 0) return `last seen today at ${t}`
  if (days === 1) return `last seen yesterday at ${t}`
  return `last seen ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d)}`
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
  initialOtherLastSeenAt = null,
  initialOtherOnline = false,
}: {
  conversationId: string
  currentUserId: string
  other: Other
  initialMessages: Msg[]
  swapRequest?: any
  initialOtherLastReadAt?: string | null
  initialOtherLastSeenAt?: string | null
  initialOtherOnline?: boolean
}) {
  const toast = useToast()
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [body, setBody] = useState("")
  const [attachment, setAttachment] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(initialOtherLastReadAt)
  const [otherTyping, setOtherTyping] = useState(false)
  const [otherOnline, setOtherOnline] = useState(initialOtherOnline)
  const [otherLastSeenAt, setOtherLastSeenAt] = useState<string | null>(initialOtherLastSeenAt)
  const [atBottom, setAtBottom] = useState(true)
  const [newCount, setNewCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const prevLastIdRef = useRef<string | null>(null)
  const lastTypingPing = useRef(0)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        // Reconcile server truth without dropping still-in-flight optimistic sends.
        // Bail out (return the same ref) when nothing changed so the list doesn't
        // re-render — and the scroll effect doesn't fire — on every idle poll.
        setMessages((prev) => {
          const optimistic = prev.filter((m) => m.id.startsWith("temp-"))
          const next = [...data.messages, ...optimistic]
          if (next.length === prev.length && next.every((m, i) => m.id === prev[i].id)) return prev
          return next
        })
        setOtherLastReadAt(data.otherLastReadAt ?? null)
        setOtherTyping(!!data.otherTyping)
        setOtherOnline(!!data.otherOnline)
        setOtherLastSeenAt(data.otherLastSeenAt ?? null)
      }
    } catch {
      /* ignore transient poll errors */
    }
  }, [conversationId])

  // Cheap status poll (read receipts + typing + presence) — runs faster than the
  // message poll so "typing…", read ticks, and online state feel responsive.
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/typing`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setOtherLastReadAt(data.otherLastReadAt ?? null)
        setOtherTyping(!!data.otherTyping)
        setOtherOnline(!!data.otherOnline)
        setOtherLastSeenAt(data.otherLastSeenAt ?? null)
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

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
    atBottomRef.current = true
    setAtBottom(true)
    setNewCount(0)
  }, [])

  // Track whether the reader is at the bottom; clear the "new messages" pill
  // once they catch up.
  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    atBottomRef.current = near
    setAtBottom(near)
    if (near) setNewCount(0)
  }

  // Land at the latest message when the thread first opens.
  useEffect(() => {
    prevLastIdRef.current = messages[messages.length - 1]?.id ?? null
    bottomRef.current?.scrollIntoView({ behavior: "auto" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // On a genuinely new message: follow it if I sent it or I'm already at the
  // bottom; otherwise leave the scroll alone and surface the jump-to-latest pill.
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.id === prevLastIdRef.current) return
    const mine = last.senderId === currentUserId
    if (mine || atBottomRef.current) scrollToBottom()
    else setNewCount((c) => c + 1)
    prevLastIdRef.current = last.id
  }, [messages, currentUserId, scrollToBottom])

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
    const ok = file.type.startsWith("image/") || ATTACH_DOC_TYPES.has(file.type)
    if (!ok) return toast("Unsupported file type. Use an image, PDF, or document.", "error")
    if (file.size > MAX_BYTES) return toast("File is over 10 MB.", "error")
    const reader = new FileReader()
    reader.onload = () => setAttachment(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function send(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (sending) return
    const text = body.trim()
    const sentAttachment = attachment
    if (!text && !sentAttachment) return

    // Optimistic: show the message immediately (this also triggers auto-scroll),
    // then reconcile the temp id with the server's once the POST returns.
    const tempId = `temp-${Date.now()}`
    const optimistic: Msg = { id: tempId, senderId: currentUserId, body: text, attachmentUrl: sentAttachment, createdAt: new Date().toISOString() }
    setMessages((m) => [...m, optimistic])
    setBody("")
    setAttachment(null)
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, attachmentUrl: sentAttachment }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast(d.error || "Could not send.", "error")
        setMessages((m) => m.filter((x) => x.id !== tempId)) // roll back
        setBody(text)
        setAttachment(sentAttachment)
      } else {
        const real = await res.json()
        setMessages((m) =>
          m.map((x) =>
            x.id === tempId
              ? { id: real.id, senderId: real.senderId, body: real.body, attachmentUrl: real.attachmentUrl, createdAt: real.createdAt }
              : x,
          ),
        )
      }
    } catch {
      toast("Could not send. Please try again.", "error")
      setMessages((m) => m.filter((x) => x.id !== tempId))
      setBody(text)
      setAttachment(sentAttachment)
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
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-xs font-bold">
              {other?.avatarInitials ?? "?"}
            </div>
            {otherOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" aria-label="Online" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[var(--navy)] truncate leading-tight">{other?.fullName ?? "Member"}</div>
            {otherTyping ? (
              <div className="text-[11px] text-[var(--teal)] font-semibold truncate">typing…</div>
            ) : otherOnline ? (
              <div className="text-[11px] text-green-600 font-semibold truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
              </div>
            ) : otherLastSeenAt ? (
              <div className="text-[11px] text-neutral truncate">{lastSeenLabel(otherLastSeenAt)}</div>
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
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#faf9f6]">
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
                      isImageData(m.attachmentUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.attachmentUrl} alt="attachment" className="rounded-lg mb-2 max-h-60 object-cover" />
                      ) : (
                        <a
                          href={m.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="flex items-center gap-2.5 mb-2 rounded-lg border border-[var(--border)] bg-white/70 px-3 py-2.5 hover:bg-white transition-colors"
                        >
                          <span className="w-8 h-8 rounded-lg bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center flex-shrink-0">
                            <FileText size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold text-[var(--navy)] truncate">{fileKind(m.attachmentUrl)}</span>
                            <span className="block text-[10px] text-neutral">Tap to open</span>
                          </span>
                        </a>
                      )
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

        {/* Jump to latest — appears when scrolled up; badges unseen new messages */}
        {!atBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-white border border-[var(--border)] shadow-lg pl-3 pr-3.5 py-2 text-xs font-semibold text-[var(--navy)] hover:bg-[var(--background)] transition-colors"
          >
            <ChevronDown size={16} className="text-[var(--gold-dark)]" />
            {newCount > 0 ? `${newCount} new message${newCount > 1 ? "s" : ""}` : "Jump to latest"}
          </button>
        )}

        {/* Composer Area */}
        <div className="bg-white border-t border-[var(--border)] p-4 relative z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <form onSubmit={(e) => send(e)}>
            {attachment && (
              <div className="mb-3">
                {isImageData(attachment) ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attachment} alt="preview" className="h-20 rounded-lg border border-[var(--border)]" />
                    <button type="button" onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-[var(--border)] text-[var(--navy)] flex items-center justify-center shadow">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 pr-2">
                    <span className="w-8 h-8 rounded-lg bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center flex-shrink-0">
                      <FileText size={16} />
                    </span>
                    <span className="text-xs font-semibold text-[var(--navy)]">{fileKind(attachment)}</span>
                    <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment" className="w-6 h-6 rounded-full text-neutral hover:text-[var(--navy)] flex items-center justify-center">
                      <X size={14} />
                    </button>
                  </div>
                )}
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
              <label className="flex-shrink-0 p-3 text-neutral hover:text-[var(--navy)] cursor-pointer transition-colors" title="Attach a file">
                <Paperclip size={20} />
                <input type="file" accept={ATTACH_ACCEPT} className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
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
