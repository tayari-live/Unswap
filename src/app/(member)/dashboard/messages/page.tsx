import Link from "next/link"
import { redirect } from "next/navigation"
import { MessageSquare, ShieldAlert, Paperclip } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { listConversations } from "@/server/services/messaging"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(d))
}

export default async function MessagesPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.verificationStatus !== "FULLY_VERIFIED") {
    return (
      <div className="max-w-2xl mx-auto pb-12">
        <PageHeader title="Messages" subtitle="Private conversations with verified members." />
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--parchment)] text-[var(--gold-dark)] flex items-center justify-center mb-5">
            <ShieldAlert size={26} />
          </div>
          <h2 className="font-display text-2xl font-bold text-[var(--navy)]">Verification required</h2>
          <p className="mt-3 text-neutral leading-relaxed">Messaging is reserved for verified members. Complete verification to start conversations.</p>
          <Link href="/verify-identity" className="mt-7 inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors">
            Get verified
          </Link>
        </div>
      </div>
    )
  }

  const conversations = await listConversations(userId)

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <PageHeader title="Messages" subtitle="Private conversations with verified members." />

      {conversations.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center mb-4">
            <MessageSquare size={26} />
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">No conversations yet</h2>
          <p className="mt-2 text-sm text-neutral">Message a host from a listing or a swap request to start talking.</p>
          <Link href="/dashboard/browse" className="mt-6 inline-flex items-center justify-center py-3 px-5 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors">
            Discover homes
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden divide-y divide-[var(--border)]">
          {conversations.map((c) => (
            <Link key={c.id} href={`/dashboard/messages/${c.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--background)] transition-colors">
              <span className="relative w-11 h-11 flex-shrink-0 rounded-full bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center text-sm font-bold">
                {c.other?.avatarInitials ?? "?"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--navy)] truncate">{c.other?.fullName ?? "Member"}</span>
                  <span className="text-xs text-neutral flex-shrink-0">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-neutral truncate">
                  {c.lastMessage?.hasAttachment && <Paperclip size={13} className="flex-shrink-0" />}
                  <span className="truncate">{c.lastMessage?.body || (c.lastMessage?.hasAttachment ? "Photo" : "No messages yet")}</span>
                </div>
              </div>
              {c.unread > 0 && (
                <span className="flex-shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-[var(--gold-dark)] text-white text-[11px] font-bold flex items-center justify-center">
                  {c.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
