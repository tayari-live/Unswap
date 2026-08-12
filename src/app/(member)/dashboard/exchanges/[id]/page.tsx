import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Calendar, Users, ChevronLeft, MapPin, FileText, Download, ShieldCheck, Star } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { pendingReviewsFor } from "@/server/services/reviews"
import { ReviewAction } from "../review-action" // Assume this is generic enough to pull from parent
import { VerificationBadge } from "@/components/ui/badges"
import { MessageButton } from "../../messages/message-button"

export const dynamic = "force-dynamic"

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}
function nights(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000))
}

export default async function ExchangeDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Must be in a confirmed/completed state to be an "Exchange"
  if (swap.status !== "CONFIRMED" && swap.status !== "IN_PROGRESS" && swap.status !== "COMPLETED") {
    // If it's a request, redirect to swaps page
    redirect(`/dashboard/swaps/${swap.id}`)
  }

  const isHost = swap.hostId === userId
  const other = isHost ? swap.requester : swap.host
  
  const pending = await pendingReviewsFor(userId)
  const reviewable = pending.find((p) => p.swapId === swap.id)

  const n = nights(swap.startDate, swap.endDate)
  
  return (
    <div className="max-w-[800px] mx-auto px-6 lg:px-10 pt-12 pb-32">
      <div className="mb-8">
        <Link href="/dashboard/exchanges" className="inline-flex items-center gap-2 font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--gold-dark)] hover:text-[var(--fg)] transition-colors">
          <ChevronLeft size={16} /> Back to My Exchanges
        </Link>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--fg)]/40">
            {swap.status.replace("_", " ")}
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-dark)]" />
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--gold-dark)]">
            {isHost ? "You're Hosting" : "You're Staying"}
          </div>
        </div>
        
        <h1 className="font-display text-[40px] md:text-[48px] font-bold text-[var(--fg)] leading-none mb-4">
          {swap.listing.city || swap.listing.title}, {swap.listing.country}
        </h1>
        
        <div className="flex flex-wrap items-center gap-3 font-sans text-[15px] text-[var(--fg)]/70">
          <span className="font-medium text-[var(--fg)]">{fmt(swap.startDate)} — {fmt(swap.endDate)}</span>
          <span className="text-[var(--fg)]/30">|</span>
          <span>{n} nights · {swap.mode === "credits" ? `${n} credits` : "Direct Swap"}</span>
        </div>
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
      </div>

      {/* Profile */}
      <div className="mb-12 border-b border-[var(--hair)] pb-12">
        <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em] mb-6">
          {isHost ? "Guest" : "Host"}
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

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 border-b border-[var(--hair)] pb-12">
        <div>
          <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em] mb-6">
            Exchange Details
          </h3>
          <div className="space-y-4 font-sans text-[15px]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--fg)]/60">Check-in</span>
              <span className="font-medium text-[var(--fg)]">{fmt(swap.startDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--fg)]/60">Check-out</span>
              <span className="font-medium text-[var(--fg)]">{fmt(swap.endDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--fg)]/60">Duration</span>
              <span className="font-medium text-[var(--fg)]">{n} nights</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--fg)]/60">Credits</span>
              <span className="font-medium text-[var(--fg)]">{swap.mode === "credits" ? n : "Direct Swap"}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em] mb-6">
            Exchange Agreement
          </h3>
          <div className="bg-[var(--navy)]/5 rounded-lg p-5">
            <p className="font-sans text-[14px] text-[var(--fg)]/80 mb-4">
              Your formal exchange agreement is ready. This document covers dates, liability, and house rules.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={`/api/swaps/${swap.id}/agreement`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--fg)] bg-[var(--surface)] border border-[var(--hair)] hover:bg-[var(--navy)]/5 px-4 py-2.5 rounded transition-colors shadow-sm"
              >
                <FileText size={15} /> View
              </a>
              <a
                href={`/api/swaps/${swap.id}/agreement?download=1`}
                className="inline-flex flex-1 items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-navy bg-[var(--gold)] hover:bg-[var(--gold-dark)] px-4 py-2.5 rounded transition-colors shadow-sm"
              >
                <Download size={15} /> Download
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Property Guarantee */}
      <div className="mb-12 border-b border-[var(--hair)] pb-12">
        <h3 className="font-sans text-xs font-bold text-[var(--fg)] uppercase tracking-[0.14em] mb-6 flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--gold)]" /> Property Guarantee
        </h3>
        <p className="font-sans text-[15px] text-[var(--fg)]/70 leading-relaxed max-w-2xl">
          This exchange is covered by the UnSwap Property Guarantee, providing protection for your home and peace of mind during your stay. Ensure all communication remains on the platform.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <MessageButton
          otherUserId={other.id}
          swapRequestId={swap.id}
          label={`Message ${other.firstName}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--fg)] bg-[var(--surface)] border border-[var(--hair)] hover:bg-[var(--navy)]/5 px-8 py-4 rounded-md transition-colors shadow-sm"
        />

        {reviewable && (
          <div className="w-full sm:w-auto">
            <ReviewAction swapId={swap.id} aboutHost={reviewable.aboutHost} otherName={other.fullName} />
          </div>
        )}
      </div>

    </div>
  )
}
