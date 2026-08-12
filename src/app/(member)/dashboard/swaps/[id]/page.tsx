import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Calendar, Users, ChevronLeft, MapPin, Star, Check, Clock } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { SwapDetailClient } from "./swap-detail-client"
import { VerificationBadge } from "@/components/ui/badges"
import { MessageButton } from "../../messages/message-button"

export const dynamic = "force-dynamic"

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}
function nights(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000))
}

export default async function SwapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const swap = await prisma.swapRequest.findUnique({
    where: { id },
    include: {
      listing: {
        include: { photos: { take: 1 } }
      },
      requester: true,
      host: true,
    }
  })

  if (!swap) return notFound()
  if (swap.hostId !== userId && swap.requesterId !== userId) return notFound()

  // Once a request moves past negotiation it's an exchange — that page has the
  // agreement, property guarantee, and other confirmed-only content this one lacks.
  if (["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(swap.status)) {
    redirect(`/dashboard/exchanges/${swap.id}`)
  }

  const isIncoming = swap.hostId === userId
  const other = isIncoming ? swap.requester : swap.host

  const timeline: { label: string; date: Date; done: boolean }[] = [
    { label: "Request received", date: swap.createdAt, done: true },
    ...(swap.counteredAt
      ? [{ label: "Counter-offer proposed", date: swap.counteredAt, done: true }]
      : []),
  ]
  const currentStep =
    swap.status === "CANCELLED"
      ? "Request cancelled"
      : swap.status === "COUNTER_OFFERED"
        ? isIncoming
          ? "Awaiting requester's response"
          : "Awaiting your response"
        : isIncoming
          ? "Awaiting your response"
          : "Awaiting host response"

  // Serialize for client
  const sData = {
    id: swap.id,
    status: swap.status,
    startDate: swap.startDate.toISOString(),
    endDate: swap.endDate.toISOString(),
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 lg:px-10 pt-12 pb-32">
      <div className="mb-8">
        <Link href="/dashboard/swaps" className="inline-flex items-center gap-2 font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--gold-dark)] hover:text-[var(--fg)] transition-colors">
          <ChevronLeft size={16} /> Back to Requests
        </Link>
      </div>

      <div className="mb-10">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--fg)]/40 mb-3">
          {isIncoming ? "Incoming Request" : "Outgoing Request"}
        </div>
        <h1 className="font-display text-[40px] md:text-[48px] font-bold text-[var(--fg)] leading-none mb-4">
          {isIncoming ? (
            <>{other.firstName} wants to stay at your home</>
          ) : (
            <>{swap.listing.city || swap.listing.title}</>
          )}
        </h1>
        {!isIncoming && (
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full bg-[var(--gold)]/10 text-[var(--gold-dark)] mt-2">
            Awaiting host response
          </div>
        )}
      </div>

      {/* Property Hero */}
      <div className="w-full aspect-[21/9] bg-[var(--navy)]/5 rounded-[12px] overflow-hidden relative mb-12 shadow-sm">
        {swap.listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/photos/${swap.listing.photos[0].id}`} alt={swap.listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--fg)]/20">
            <MapPin size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white">
          <div className="font-display text-[32px] font-bold leading-none mb-1">{isIncoming ? "YOUR HOME" : swap.listing.title}</div>
          <div className="font-sans text-[15px] text-white/80">{swap.listing.city}, {swap.listing.country}</div>
        </div>
      </div>

      {/* Member Profile */}
      <div className="mb-12 border-b border-[var(--hair)] pb-12">
        <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em] mb-6">
          {isIncoming ? "Requester" : "Host"}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-[var(--navy)]/8 text-[var(--gold-dark)] flex items-center justify-center text-xl font-bold">
              {other.firstName?.[0]}{other.lastName?.[0]}
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-[24px] font-bold text-[var(--fg)] leading-none">{other.firstName}</span>
              <div className="flex items-center gap-2">
                <span className="font-sans text-[14px] text-[var(--fg)]/60">{other.organisation || "UnSwap Member"}</span>
                <VerificationBadge status={other.verificationStatus} />
              </div>
              <span className="flex items-center gap-1 font-sans text-[13px] text-[var(--fg)]/70">
                <Star size={13} className="text-[var(--gold)] fill-[var(--gold)]" />
                {other.trustScore != null ? `${other.trustScore.toFixed(1)} trust score` : "New member"}
              </span>
            </div>
          </div>
          <Link href={`/dashboard/members/${other.id}`} className="inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--fg)] bg-[var(--navy)]/5 hover:bg-[var(--navy)]/10 px-5 py-2.5 rounded transition-colors">
            View Profile &rarr;
          </Link>
        </div>
      </div>

      {/* Request Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 border-b border-[var(--hair)] pb-12">
        <div>
          <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em] mb-6">
            Request Details
          </h3>
          <div className="flex flex-col gap-3 font-sans text-[16px] text-[var(--fg)] font-medium">
            <span className="flex items-center gap-3"><Calendar size={18} className="text-[var(--gold-dark)]" /> {fmt(swap.startDate)} — {fmt(swap.endDate)}</span>
            <span className="flex items-center gap-3"><Users size={18} className="text-[var(--gold-dark)]" /> {swap.guests} guests</span>
            <span className="flex items-center gap-3 ml-[30px]">{nights(swap.startDate, swap.endDate)} nights · {swap.mode === "credits" ? `${nights(swap.startDate, swap.endDate)} credits` : "Direct Swap"}</span>
          </div>
        </div>

        {swap.message && (
          <div>
            <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em] mb-6">
              Message from {other.firstName}
            </h3>
            <p className="font-sans text-[15px] text-[var(--fg)]/80 leading-relaxed italic border-l-2 border-[var(--gold)] pl-4">
              "{swap.message}"
            </p>
          </div>
        )}
      </div>

      {/* Request Timeline */}
      <div className="mb-12 border-b border-[var(--hair)] pb-12">
        <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em] mb-6">
          Request Timeline
        </h3>
        <div className="flex flex-col gap-4">
          {timeline.map((step, i) => (
            <div key={i} className="flex items-center gap-3 font-sans text-[14px]">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--gold)]/15 text-[var(--gold-dark)] flex-shrink-0">
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="text-[var(--fg)] font-medium">{step.label}</span>
              <span className="text-[var(--fg)]/40">· {fmt(step.date)}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 font-sans text-[14px]">
            <span className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 ${swap.status === "CANCELLED" ? "bg-[var(--crimson)]/15 text-[var(--crimson)]" : "bg-[var(--navy)]/10 text-[var(--fg)]/50"}`}>
              <Clock size={12} />
            </span>
            <span className={swap.status === "CANCELLED" ? "text-[var(--crimson)] font-medium" : "text-[var(--fg)]/60 font-medium"}>{currentStep}</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <MessageButton
          otherUserId={other.id}
          swapRequestId={swap.id}
          label={`Message ${other.firstName}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--fg)] bg-[var(--surface)] border border-[var(--hair)] hover:bg-[var(--navy)]/5 px-8 py-4 rounded-md transition-colors shadow-sm"
        />
      </div>

      <SwapDetailClient swap={sData} isIncoming={isIncoming} />
    </div>
  )
}
