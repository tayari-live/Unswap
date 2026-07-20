"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Search, Paperclip } from "lucide-react"

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(d))
}

export function MessagesLayoutShell({
  conversations,
  children,
}: {
  conversations: any[]
  children: React.ReactNode
}) {
  const params = useParams()
  const activeId = params.id as string | undefined
  const [query, setQuery] = useState("")

  // Filter by the other member's name/organisation or the last message text.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter(
      (c) =>
        (c.other?.fullName ?? "").toLowerCase().includes(q) ||
        (c.other?.organisation ?? "").toLowerCase().includes(q) ||
        (c.lastMessage?.body ?? "").toLowerCase().includes(q)
    )
  }, [conversations, query])

  return (
    <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-5.5rem)] -mt-6 -mx-4 md:-mx-8 bg-white border-t border-[var(--border)] overflow-hidden relative">
      {/* Left Pane - List of Conversations */}
      <div 
        className={`w-full md:w-[320px] lg:w-[340px] flex-shrink-0 border-r border-[var(--border)] flex flex-col bg-[#faf9f6] z-10 ${
          activeId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-[var(--border)] bg-white flex items-center justify-between">
          <h2 className="font-bold text-[var(--navy)]">All messages</h2>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages"
              className="w-full pl-9 pr-3 py-2 bg-white border border-[var(--border)] rounded-lg text-sm text-[var(--navy)] focus:outline-none focus:border-[var(--gold)] shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral">
              {query ? "No conversations match your search." : "No conversations yet."}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]/50">
              {filtered.map((c) => {
                const isActive = c.id === activeId
                return (
                  <Link 
                    key={c.id} 
                    href={`/dashboard/messages/${c.id}`} 
                    className={`block p-4 transition-colors ${
                      isActive 
                        ? "bg-[#f4efe8] border-l-4 border-l-[var(--gold)]" 
                        : "hover:bg-white border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className="relative flex-shrink-0 mt-0.5">
                        <span className="w-10 h-10 rounded-full bg-white border border-[var(--border)] text-[var(--navy)] flex items-center justify-center text-sm font-bold overflow-hidden">
                          {c.other?.avatarInitials ?? "?"}
                        </span>
                        {c.other?.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#faf9f6]" aria-label="Online" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-bold text-[var(--navy)] text-sm truncate">{c.other?.fullName ?? "Member"}</span>
                          <span className="text-[11px] font-medium text-neutral flex-shrink-0">{timeAgo(c.lastMessageAt)}</span>
                        </div>
                        <div className="text-[11px] text-neutral/80 truncate mb-1 uppercase tracking-wider font-semibold">
                          {c.other?.organisation ? `${c.other.organisation} member` : "Verified member"}
                        </div>
                        <div className={`flex items-center gap-1.5 text-sm truncate ${c.unread > 0 ? "font-semibold text-[var(--navy)]" : "text-neutral"}`}>
                          {c.lastMessage?.hasAttachment && <Paperclip size={13} className="flex-shrink-0" />}
                          <span className="truncate">{c.lastMessage?.body || (c.lastMessage?.hasAttachment ? "Photo" : "No messages")}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Area - Dynamic Content */}
      <div 
        className={`flex-1 flex-col bg-white overflow-hidden relative ${
          !activeId ? "hidden md:flex" : "flex"
        }`}
      >
        {children}
      </div>
    </div>
  )
}
