"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircleQuestion, Send, X, Sparkles, Check, CheckCheck } from "lucide-react"
import { useToast } from "@/components/ui/toast"

type Msg = { role: "user" | "assistant"; content: string; at: number }

function clock(ts: number) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts))
}

const SUGGESTIONS = [
  "How do I get verified?",
  "How do credits work?",
  "How do I list my home?",
  "What do the membership tiers include?",
]

/**
 * The UnSwap Guide — a floating in-app assistant that answers questions about
 * how to use the app. Powered by Claude Haiku via /api/ai/assistant.
 */
export function AppAssistant() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, busy])

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
        toast(data.error || "The guide couldn't answer. Please try again.", "error")
        return
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply, at: Date.now() }])
    } catch {
      toast("The guide couldn't answer. Please try again.", "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Launcher — sits above the mobile bottom nav; hidden behind the
          full-screen sheet on mobile while the guide is open */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close the UnSwap Guide" : "Open the UnSwap Guide"}
        className={`fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[90] w-13 h-13 p-3.5 rounded-full bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] text-white shadow-lg transition-colors ${
          open ? "hidden md:block" : ""
        }`}
      >
        {open ? <X size={22} /> : <MessageCircleQuestion size={22} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="UnSwap Guide"
          className="fixed z-[95] inset-x-2 top-16 bottom-2 md:inset-auto md:bottom-22 md:right-6 md:top-auto md:w-full md:max-w-sm md:h-[min(28rem,calc(100dvh-7.5rem))] bg-surface border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[var(--navy)] text-white">
            <span className="w-8 h-8 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] flex items-center justify-center">
              <Sparkles size={15} />
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold leading-tight">UnSwap Guide</div>
              <div className="text-[11px] text-white/60">Ask anything about using the app</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the guide"
              className="w-8 h-8 rounded-full hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div>
                <p className="text-sm text-neutral-dark leading-relaxed">
                  Hi! I can explain how UnSwap works — verification, listing your
                  home, swaps, credits, and membership. What would you like to know?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="text-xs font-semibold text-[var(--navy)] bg-white border border-[var(--border)] hover:border-[var(--gold)] px-3 py-1.5 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => {
              // A user message is "seen" once the guide has replied to it.
              const seen = m.role === "user" && messages.slice(i + 1).some((n) => n.role === "assistant")
              return (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      m.role === "user"
                        ? "bg-[var(--navy)] text-white"
                        : "bg-[var(--background)] border border-[var(--border)] text-[var(--navy)]"
                    }`}
                  >
                    {m.content}
                    <div className={`text-[10px] mt-1 font-medium flex items-center gap-1 ${m.role === "user" ? "justify-end text-white/50" : "text-neutral/70"}`}>
                      <span>{clock(m.at)}</span>
                      {m.role === "user" && (
                        seen ? (
                          <CheckCheck size={13} className="text-[var(--gold)]" aria-label="Seen by the guide" />
                        ) : (
                          <Check size={13} className="text-white/50" aria-label="Sent" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-neutral text-sm">
                  Thinking…
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
            className="flex items-center gap-2 border-t border-[var(--border)] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the guide…"
              className="flex-1 px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-white text-sm text-[var(--navy)] placeholder-neutral focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]"
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
