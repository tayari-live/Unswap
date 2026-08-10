import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Home,
  ArrowLeftRight,
  CalendarCheck,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Check,
  Star,
  ChevronRight,
  Search,
} from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { cn } from "@/lib/utils"
import { LuxPageHeader, SectionLabel } from "@/components/ui/lux"
import { ResendEmailButton } from "@/components/ui/resend-email-button"
import { PROFILE_COMPLETE_AT } from "@/server/services/profile"

export const dynamic = "force-dynamic"

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const TIER_LABELS: Record<string, string> = {
  limited_1x: "Limited 1X",
  standard_2x: "Standard 2X",
  professional_4x: "Professional 4X",
  unlimited_pro: "Unlimited Pro",
  lifetime: "Lifetime",
}

const VERIFICATION_LABELS: Record<string, string> = {
  PENDING_EMAIL: "Confirm your email",
  EMAIL_VERIFIED: "Upload your staff ID",
  PENDING_ID_REVIEW: "ID under review",
  FULLY_VERIFIED: "Fully verified",
  REJECTED: "Verification rejected",
  SUSPENDED: "Account suspended",
}

const PENDING_INCOMING = ["REQUESTED", "COUNTER_OFFERED"]
const UPCOMING = ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"]

function nights(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000))
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

export default async function MemberDashboardPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  // Select only what this page renders. A bare `include` would also pull every
  // user's imageUrl, which holds a base64 photo (~130 KB each) — once for the
  // viewer and again for every requester/host in the lists.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      profileCompletion: true,
      trustScore: true,
      verificationStatus: true,
      listings: true,
      subscription: true,
      hostedRequests: {
        include: { requester: { select: { fullName: true, avatarInitials: true } }, listing: true },
        orderBy: { createdAt: "desc" },
      },
      sentRequests: {
        include: { host: { select: { fullName: true, avatarInitials: true } }, listing: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!user) redirect("/login")

  const activeListings = user.listings.filter((l) => l.status === "ACTIVE").length
  const incoming = user.hostedRequests.filter((r) => PENDING_INCOMING.includes(r.status))
  const upcoming = [...user.hostedRequests, ...user.sentRequests]
    .filter((r) => UPCOMING.includes(r.status))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  // Credits: 1 night hosted = 1 credit earned; 1 night stayed = 1 spent.
  const earned = user.hostedRequests
    .filter((r) => r.status === "COMPLETED" && r.mode === "credits")
    .reduce((s, r) => s + nights(r.startDate, r.endDate), 0)
  const spent = user.sentRequests
    .filter((r) => r.status === "COMPLETED" && r.mode === "credits")
    .reduce((s, r) => s + nights(r.startDate, r.endDate), 0)
  const credits = earned - spent

  const isVerified = user.verificationStatus === "FULLY_VERIFIED"
  const profileIncomplete = user.profileCompletion < PROFILE_COMPLETE_AT

  // Getting-started checklist — consolidates the onboarding path; hidden once done.
  const idReview = user.verificationStatus === "PENDING_ID_REVIEW"

  // On rejection, surface the reviewer's note so the member knows what to fix.
  const lastRejection =
    user.verificationStatus === "REJECTED"
      ? await prisma.verificationSubmission.findFirst({
          where: { memberId: userId, status: "REJECTED" },
          orderBy: { reviewedAt: "desc" },
          select: { reviewNote: true },
        })
      : null
  const checklist = [
    {
      title: "Confirm your email",
      sub: user.verificationStatus === "PENDING_EMAIL" ? "Check your inbox for the confirmation link." : null,
      done: user.verificationStatus !== "PENDING_EMAIL",
      href: undefined as string | undefined,
      action: "",
      resendEmail: user.verificationStatus === "PENDING_EMAIL" ? user.email : undefined,
    },
    {
      title: "Complete your profile",
      sub: profileIncomplete ? `${user.profileCompletion}% done — members exchange with people, not just listings.` : null,
      done: !profileIncomplete,
      href: "/dashboard/profile",
      action: "Complete",
    },
    {
      title: "List your first home",
      sub: user.listings.length ? null : "Add a home you'd like to offer for exchange.",
      done: user.listings.length > 0,
      href: "/dashboard/listings/new",
      action: "Add home",
    },
    {
      title: "Verify your identity",
      sub: isVerified
        ? null
        : idReview
        ? "Under review — usually within 2 business days."
        : user.verificationStatus === "REJECTED"
        ? `Not approved${lastRejection?.reviewNote ? ` — “${lastRejection.reviewNote}”` : ""}. Resubmit with updated documents.`
        : "Required to request or accept a swap.",
      done: isVerified,
      href: isVerified || idReview ? undefined : "/verify-identity",
      action: user.verificationStatus === "REJECTED" ? "Resubmit" : "Verify",
    },
  ]
  const checklistDone = checklist.filter((s) => s.done).length
  const showChecklist = checklistDone < checklist.length

  // Determine welcome subtext based on state
  let subtext = "Ready to find your next home?"
  if (upcoming.length > 0) subtext = "Your next stay is coming up."
  else if (activeListings > 0) subtext = "Your home is ready to welcome another member."

  // Mock recommended homes
  const recommendedHomes = [
    { city: "Geneva", country: "Switzerland", image: "/images/residence-geneva.png", nights: 7, credits: 7 },
    { city: "Mayfair, London", country: "United Kingdom", image: "/images/residence-mayfair.png", nights: 5, credits: 5 },
    { city: "Singapore", country: "Singapore", image: "/images/residence-singapore.png", nights: 10, credits: 10 }
  ];

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[var(--parchment)]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 pb-20">
        
        {/* 1. Welcome Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl md:text-[48px] font-bold text-navy tracking-tight leading-none mb-3">
            {greeting()}, {user.firstName || "Member"}.
          </h1>
          <p className="font-sans text-sm md:text-[15px] text-navy/65">
            {subtext}
          </p>
          <div className="w-8 h-[2px] bg-[var(--gold)] mt-6" />
        </div>

        {/* 2. Member Status / Summary Strip */}
        <div className="flex flex-wrap lg:flex-nowrap gap-y-8 mb-12">
          {/* Credits */}
          <Link href="/dashboard/credits" className="w-1/2 lg:w-1/4 group lg:pr-8">
            <div className="font-display text-[32px] md:text-[40px] font-bold text-navy leading-none mb-1 group-hover:text-[var(--gold-dark)] transition-colors">
              {credits}
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.12em]">Credits</span>
              <span className="font-sans text-[13px] text-navy/60 mt-1 pr-2">
                {credits === 0 ? "Earn credits by hosting homes." : `Enough for up to ${credits} nights.`}
              </span>
            </div>
          </Link>
          
          {/* Homes */}
          <Link href="/dashboard/listings" className="w-1/2 lg:w-1/4 group lg:px-8 lg:border-l border-[var(--hair)]">
            <div className="font-display text-[32px] md:text-[40px] font-bold text-navy leading-none mb-1 group-hover:text-[var(--gold-dark)] transition-colors">
              {activeListings}
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.12em]">My Homes</span>
              <span className="font-sans text-[13px] text-navy/60 mt-1 pr-2">
                {activeListings === 0 ? "List a home to start." : `${activeListings} listed propert${activeListings === 1 ? "y" : "ies"}.`}
              </span>
            </div>
          </Link>
          
          {/* Swaps */}
          <Link href="/dashboard/swaps" className="w-1/2 lg:w-1/4 group lg:px-8 lg:border-l border-[var(--hair)]">
            <div className="font-display text-[32px] md:text-[40px] font-bold text-navy leading-none mb-1 group-hover:text-[var(--gold-dark)] transition-colors">
              {upcoming.length}
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.12em]">Active Swaps</span>
              <span className="font-sans text-[13px] text-navy/60 mt-1 pr-2">
                {upcoming.length === 0 ? "No active stays." : `${upcoming.length} upcoming or in-progress.`}
              </span>
            </div>
          </Link>
          
          {/* Messages */}
          <Link href="/dashboard/messages" className="w-1/2 lg:w-1/4 group lg:pl-8 lg:border-l border-[var(--hair)]">
            <div className="font-display text-[32px] md:text-[40px] font-bold text-navy leading-none mb-1 group-hover:text-[var(--gold-dark)] transition-colors">
              0 {/* Note: Client-side unread count lives in navbar, server-side count requires query */}
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.12em]">Messages</span>
              <span className="font-sans text-[13px] text-navy/60 mt-1 pr-2">Check your inbox.</span>
            </div>
          </Link>
        </div>

        {/* 3. Primary Discovery Module */}
        <div className="bg-[var(--navy)] rounded-lg p-10 md:p-14 mb-16 shadow-md overflow-hidden relative">
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-display text-[36px] md:text-[44px] text-[var(--gold)] font-bold mb-3 leading-none">
              FIND YOUR NEXT STAY
            </h2>
            <p className="font-sans text-white/80 text-[15px] mb-10">
              Where will your work take you next?
            </p>
            
            {/* Native HTML form works perfectly in server components for GET requests */}
            <form action="/dashboard/browse" method="GET" className="relative mb-8 max-w-xl">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
              <input
                type="search"
                name="q"
                placeholder="Search a city, country or duty station..."
                className="w-full h-14 pl-12 pr-4 rounded-lg bg-white border border-transparent text-[15px] text-navy placeholder:text-navy/50 focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)] transition-colors shadow-sm"
              />
            </form>

            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/dashboard/browse"
                className="inline-flex items-center justify-center px-7 py-3 rounded-md bg-[var(--gold)] text-navy font-sans font-bold text-[13px] uppercase tracking-[0.08em] hover:bg-white transition-colors"
              >
                Explore Homes
              </Link>
              <Link
                href="/dashboard/browse?view=map"
                className="inline-flex items-center gap-2 text-[13px] font-sans font-semibold text-white/80 hover:text-white transition-colors"
              >
                Explore Map <ChevronRight size={14} />
              </Link>
            </div>
          </div>
          
          {/* Subtle decorative background element for the navy block */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
        </div>

        {/* 4. Upcoming Exchanges (Conditional) */}
        {upcoming.length > 0 ? (
          <div className="mb-16">
            <h3 className="font-sans text-xs font-bold text-navy uppercase tracking-[0.14em] mb-4">
              Upcoming Exchanges
            </h3>
            <div className="border-t border-[var(--hair)] pt-6">
              {upcoming.map((r) => (
                <div key={r.id} className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-[var(--hair)] group last:border-0 last:mb-0 last:pb-0">
                  <div className="flex flex-col mb-4 md:mb-0">
                    <div className="font-display text-[26px] md:text-[32px] text-navy font-bold leading-none mb-2">
                      {r.listing.city || r.listing.title} <span className="font-sans text-[18px] text-navy/60 font-normal">· {r.listing.country || "UnSwap"}</span>
                    </div>
                    <div className="font-sans text-[15px] text-navy/80">
                      {fmtDate(r.startDate)} – {fmtDate(r.endDate)} · {nights(r.startDate, r.endDate)} nights
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 bg-[var(--parchment-dark)] text-navy rounded-full">
                      Confirmed
                    </span>
                    <Link href="/dashboard/swaps" className="text-[13px] font-medium text-[var(--gold-dark)] hover:text-navy transition-colors flex items-center gap-1">
                      View exchange <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-16">
            <h3 className="font-sans text-xs font-bold text-navy uppercase tracking-[0.14em] mb-4">
              Upcoming Exchanges
            </h3>
            <div className="border-t border-[var(--hair)] py-8">
              <p className="font-sans text-[15px] text-navy/70 mb-2">No upcoming exchanges yet.</p>
              <Link href="/dashboard/browse" className="text-[14px] font-medium text-[var(--gold-dark)] hover:text-navy transition-colors">
                Explore homes to find your next stay &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* 5. Swap Requests (Conditional) */}
        {incoming.length > 0 && (
          <div className="mb-16">
            <h3 className="font-sans text-xs font-bold text-navy uppercase tracking-[0.14em] mb-4">
              Swap Requests
            </h3>
            <div className="border-t border-[var(--hair)] pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex flex-col mb-4 md:mb-0">
                  <div className="font-display text-[24px] text-navy font-bold leading-none mb-2">
                    {incoming.length} incoming request{incoming.length > 1 ? "s" : ""}
                  </div>
                  <div className="font-sans text-[15px] text-navy/80">
                    {incoming.length === 1 
                      ? `Someone wants to stay at your home in ${incoming[0].listing.city || incoming[0].listing.title}.`
                      : "Multiple members have requested to stay at your homes."}
                  </div>
                </div>
                <Link href="/dashboard/swaps" className="inline-flex items-center justify-center px-6 py-2.5 rounded-md bg-[var(--navy)] text-white font-sans font-bold text-[12px] uppercase tracking-[0.08em] hover:bg-navy/90 transition-colors shadow-sm">
                  Review requests <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 6. Your Next Steps (Conditional) */}
        {showChecklist && !isVerified && (
          <div className="mb-16">
            <h3 className="font-sans text-xs font-bold text-navy uppercase tracking-[0.14em] mb-4">
              Your Next Steps
            </h3>
            <div className="border-t border-[var(--hair)] max-w-3xl">
              {checklist.map((s, i) => {
                const isVerify = s.title === "Verify your identity";
                return (
                  <div key={i} className={cn("flex items-start sm:items-center justify-between py-5 border-b border-[var(--hair)] group", isVerify && !s.done && "bg-[var(--gold)]/10 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-lg mt-2 border-transparent")}>
                    <div className="flex items-start sm:items-center gap-4">
                      <span className={`flex-shrink-0 mt-0.5 sm:mt-0 ${s.done ? "text-[var(--gold)]" : (isVerify ? "text-[var(--gold-dark)]" : "text-navy/30")}`}>
                        {s.done ? <Check size={18} strokeWidth={2.5} /> : (isVerify ? <Star size={18} fill="currentColor" /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-current" />)}
                      </span>
                      <div className="flex flex-col">
                        <span className={`font-sans text-[15px] ${s.done ? "text-navy/60" : "text-navy font-bold"}`}>
                          {s.title}
                        </span>
                        {isVerify && !s.done && (
                          <span className="font-sans text-[14px] text-navy/70 mt-1 leading-snug">
                            Required to access the full UnSwap network.
                          </span>
                        )}
                      </div>
                    </div>
                    {!s.done && s.href && (
                      <Link href={s.href} className="flex-shrink-0 text-[13px] font-bold text-[var(--gold-dark)] hover:text-navy transition-colors flex items-center gap-1 mt-1 sm:mt-0">
                        {s.action} <ChevronRight size={14} />
                      </Link>
                    )}
                    {s.done && (
                      <span className="flex-shrink-0 text-[13px] font-medium text-navy/40 mt-1 sm:mt-0">Complete</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Recommended Homes */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sans text-xs font-bold text-navy uppercase tracking-[0.14em]">
              Recommended For You
            </h3>
            <Link href="/dashboard/browse" className="text-[13px] font-medium text-navy/70 hover:text-navy flex items-center gap-1 transition-colors">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedHomes.map((home, idx) => (
              <Link key={idx} href={`/dashboard/browse?q=${home.city}`} className="group flex flex-col bg-[var(--parchment-dark)] rounded-[10px] overflow-hidden border border-transparent hover:border-[var(--hair)] transition-colors">
                <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={home.image} alt={home.city} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                </div>
                <div className="p-5">
                  <h4 className="font-display text-[24px] font-bold text-navy leading-none mb-1">{home.city}</h4>
                  <div className="font-sans text-[13px] text-navy/70 mb-3">{home.country}</div>
                  <div className="font-sans text-[13px] text-navy font-medium">
                    {home.nights} nights · {home.credits} credits
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 8. Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sans text-xs font-bold text-navy uppercase tracking-[0.14em]">
              Recent Activity
            </h3>
            <Link href="/dashboard/notifications" className="text-[13px] font-medium text-navy/70 hover:text-navy flex items-center gap-1 transition-colors">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="border-t border-[var(--hair)] max-w-3xl">
            {incoming.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-start justify-between py-4 border-b border-[var(--hair)]">
                <div className="flex items-start gap-3">
                  <span className="text-[var(--gold)] mt-0.5"><Check size={18} /></span>
                  <div className="flex flex-col">
                    <span className="font-sans text-[15px] text-navy font-medium">
                      Swap request {r.status === "COUNTER_OFFERED" ? "countered" : "received"}
                    </span>
                    <span className="font-sans text-[13px] text-navy/70 mt-0.5">
                      From {r.requester.fullName} for {r.listing.title}
                    </span>
                  </div>
                </div>
                <span className="flex-shrink-0 font-sans text-[13px] text-navy/50">{fmtDate(r.createdAt)}</span>
              </div>
            ))}
            {incoming.length === 0 && (
              <div className="py-8 text-[14px] text-navy/60 font-sans italic">
                No recent activity. Actions like received swap requests will appear here.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
