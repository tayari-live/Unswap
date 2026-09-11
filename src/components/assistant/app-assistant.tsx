"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircleQuestion, Send, X, Sparkles, Check, CheckCheck, LifeBuoy } from "lucide-react"
import { useToast } from "@/components/ui/toast"

type Msg = { role: "user" | "assistant"; content: string; at: number; escalate?: boolean }

// Silent signal Vera appends when a question needs a human. Stripped before the
// reply is shown; its presence turns on the "contact the team" card instead.
const ESCALATE_MARKER = "[[ESCALATE]]"
const SUPPORT_EMAIL = "hello@unswap.net"

function clock(ts: number) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts))
}

const SUGGESTIONS = [
  "How do I get verified?",
  "How do points work?",
  "How do I list my home?",
  "What do the membership tiers include?",
]

// Three-dot "typing" indicator — a lighter touch than static text while Vera
// composes a reply.
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5" aria-label="Vera is typing">
      <span className="w-1.5 h-1.5 rounded-full bg-neutral/70 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-neutral/70 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-neutral/70 animate-bounce" />
    </span>
  )
}

/**
 * Vera — a floating in-app guide that answers questions about how to use the
 * app, and can hand a member to the UnSwap team when a question needs a human.
 * Powered by Claude Haiku via /api/ai/assistant.
 */
export function AppAssistant() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, busy])

  // Focus the composer when the panel opens, so members can type straight away.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function ask(question: string) {
    const q = question.trim()
    if (!q || busy) return
    setInput("")
    const next: Msg[] = [...messages, { role: "user", content: q, at: Date.now() }]
    setMessages(next)
    setBusy(true)
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || "Vera couldn't answer. Please try again.", "error")
        return
      }
      let reply = String(data.reply ?? "")
      const escalate = reply.includes(ESCALATE_MARKER)
      if (escalate) reply = reply.replaceAll(ESCALATE_MARKER, "").trim()
      setMessages((m) => [...m, { role: "assistant", content: reply, at: Date.now(), escalate }])
    } catch {
      toast("Vera couldn't answer. Please try again.", "error")
    } finally {
      setBusy(false)
    }
  }

  // Send the conversation to the UnSwap team. Used both by Vera's escalation
  // card and the "talk to a person" link on the intro screen.
  async function escalate() {
    if (escalating) return
    setEscalating(true)
    try {
      const res = await fetch("/api/ai/assistant/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(data.error || `Couldn't reach the team. Please email ${SUPPORT_EMAIL}.`, "error")
        return
      }
      setMessages((m) => [
        // Clear any open escalation offers — it's been handed over now.
        ...m.map((x) => (x.escalate ? { ...x, escalate: false } : x)),
        {
          role: "assistant",
          content: `Done. I've shared this with the UnSwap team${
            data.email ? `, and they'll reply by email to ${data.email}` : ""
          }. Anything else I can help with in the meantime?`,
          at: Date.now(),
        },
      ])
    } catch {
      toast(`Couldn't reach the team. Please email ${SUPPORT_EMAIL}.`, "error")
    } finally {
      setEscalating(false)
    }
  }

  return (
    <>
      {/* Launcher — sits above the mobile bottom nav; hidden behind the
          full-screen sheet on mobile while Vera is open */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Vera" : "Chat with Vera, the UnSwap guide"}
        className={`fixed bottom-24 md:bottom-6 right-4 md:right-6 z-drawer w-13 h-13 p-3.5 rounded-full bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] text-white transition-colors ${
          open ? "hidden md:block" : ""
        }`}
      >
        {open ? <X size={22} /> : <MessageCircleQuestion size={22} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Vera, the UnSwap guide"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false)
          }}
          className="fixed z-drawer inset-x-2 top-16 bottom-2 md:inset-auto md:bottom-22 md:right-6 md:top-auto md:w-full md:max-w-sm md:h-[min(28rem,calc(100dvh-7.5rem))] bg-surface border border-[var(--hair)] rounded-md shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[var(--navy)] text-white">
            <span className="w-8 h-8 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] flex items-center justify-center">
              <Sparkles size={15} />
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold leading-tight">Vera</div>
              <div className="text-[11px] text-white/60">Your UnSwap guide</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Vera"
              className="w-8 h-8 rounded-full hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
            {messages.length === 0 && (
              <div>
                <p className="text-sm text-neutral-dark leading-relaxed">
                  Hi, I&apos;m Vera. I can explain how UnSwap works, including verification, listing
                  your home, swaps, points, and membership. What would you like to know?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="text-xs font-semibold text-[var(--fg)] bg-[var(--surface)] border border-[var(--hair)] hover:border-[var(--gold)] px-3 py-1.5 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={escalate}
                  disabled={escalating}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-neutral hover:text-[var(--fg)] disabled:opacity-50 transition-colors"
                >
                  <LifeBuoy size={13} />
                  {escalating ? "Contacting the team…" : "Prefer a person? Contact the team"}
                </button>
              </div>
            )}
            {messages.map((m, i) => {
              // A user message is "seen" once Vera has replied to it.
              const seen = m.role === "user" && messages.slice(i + 1).some((n) => n.role === "assistant")
              return (
                <div key={i}>
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        m.role === "user"
                          ? "bg-[var(--navy)] text-white"
                          : "bg-[var(--background)] border border-[var(--hair)] text-[var(--fg)]"
                      }`}
                    >
                      {m.content}
                      <div className={`text-[10px] mt-1 font-medium flex items-center gap-1 ${m.role === "user" ? "justify-end text-white/50" : "text-neutral/70"}`}>
                        <span>{clock(m.at)}</span>
                        {m.role === "user" && (
                          seen ? (
                            <CheckCheck size={13} className="text-[var(--gold)]" aria-label="Seen by Vera" />
                          ) : (
                            <Check size={13} className="text-white/50" aria-label="Sent" />
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Escalation offer — shown under a reply Vera flagged as needing
                      a human, until the member hands it over. */}
                  {m.role === "assistant" && m.escalate && (
                    <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 px-3 py-2.5 max-w-[85%]">
                      <LifeBuoy size={15} className="text-[var(--gold-dark)] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-neutral-dark leading-relaxed">
                          Want a hand from a person on the UnSwap team?
                        </p>
                        <button
                          type="button"
                          onClick={escalate}
                          disabled={escalating}
                          className="mt-1.5 text-xs font-bold text-[var(--gold-dark)] hover:underline disabled:opacity-50 disabled:no-underline"
                        >
                          {escalating ? "Sending…" : "Contact the UnSwap team"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3.5 py-2.5 bg-[var(--background)] border border-[var(--hair)]">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              ask(input)
            }}
            className="flex items-center gap-2 border-t border-[var(--hair)] p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Vera…"
              className="flex-1 px-3.5 py-2.5 border border-[var(--hair)] rounded-xl bg-[var(--surface)] text-sm text-[var(--fg)] placeholder:text-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] text-white flex items-center justify-center disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
