"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Send, ImagePlus, X, BadgeCheck } from "lucide-react"

type Msg = { id: string; senderId: string; body: string; attachmentUrl: string | null; createdAt: string }
type Other = { id: string; fullName: string; avatarInitials: string; verificationStatus: string } | null

const MAX_BYTES = 10 * 1024 * 1024

function clock(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
}

export function Thread({
  conversationId,
  currentUserId,
  other,
  initialMessages,
}: {
  conversationId: string
  currentUserId: string
  other: Other
  initialMessages: Msg[]
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [body, setBody] = useState("")
  const [attachment, setAttachment] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch {
      /* ignore transient poll errors */
    }
  }, [conversationId])

  // Poll for new messages.
  useEffect(() => {
    const t = setInterval(refresh, 4000)
    return () => clearInterval(t)
  }, [refresh])

  // Keep pinned to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function pickFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) return setError("Attachments must be an image.")
    if (file.size > MAX_BYTES) return setError("Image is over 10 MB.")
    const reader = new FileReader()
    reader.onload = () => setAttachment(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    if (!body.trim() && !attachment) return
    setSending(true)
    setError("")
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, attachmentUrl: attachment }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || "Could not send.")
      } else {
        setBody("")
        setAttachment(null)
        await refresh()
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
        <Link href="/dashboard/messages" className="text-neutral hover:text-[var(--navy)]">
          <ArrowLeft size={20} />
        </Link>
        <span className="w-10 h-10 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-sm font-bold">
          {other?.avatarInitials ?? "?"}
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-[var(--navy)]">{other?.fullName ?? "Member"}</span>
            {other?.verificationStatus === "FULLY_VERIFIED" && <BadgeCheck size={15} className="text-[var(--teal)]" />}
          </div>
          <span className="text-xs text-neutral">Verified member</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-neutral py-10">No messages yet. Say hello.</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${mine ? "bg-[var(--navy)] text-white" : "bg-surface border border-[var(--border)] text-[var(--navy)]"}`}>
                {m.attachmentUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.attachmentUrl} alt="attachment" className="rounded-lg mb-1.5 max-h-60 object-cover" />
                )}
                {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                <div className={`text-[10px] mt-1 ${mine ? "text-white/50" : "text-neutral"}`}>{clock(m.createdAt)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="border-t border-[var(--border)] pt-3">
        {error && <p className="text-xs text-[var(--crimson)] font-medium mb-2">{error}</p>}
        {attachment && (
          <div className="relative inline-block mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={attachment} alt="preview" className="h-20 rounded-lg border border-[var(--border)]" />
            <button type="button" onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-[var(--border)] text-[var(--navy)] flex items-center justify-center shadow">
              <X size={13} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="flex-shrink-0 w-11 h-11 rounded-xl border border-[var(--border)] flex items-center justify-center text-neutral hover:border-[var(--gold)] hover:text-[var(--navy)] cursor-pointer transition-colors">
            <ImagePlus size={18} />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e) } }}
            rows={1}
            placeholder="Write a message…"
            className="flex-1 resize-none px-4 py-3 border border-[var(--border)] rounded-xl bg-white text-sm text-[var(--navy)] placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"
          />
          <button
            type="submit"
            disabled={sending || (!body.trim() && !attachment)}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] text-white flex items-center justify-center disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
