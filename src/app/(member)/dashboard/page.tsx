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
  PlusCircle,
  Search,
} from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { LuxPageHeader, SectionLabel } from "@/components/ui/lux"
import { ResendEmailButton } from "@/components/ui/resend-email-button"
import { PROFILE_COMPLETE_AT } from "@/server/services/profile"

export const dynamic = "force-dynamic"

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
    { city: "Geneva", country: "Switzerland", image: "/residence_geneva.jpg", nights: 7, credits: 7 },
    { city: "Nairobi", country: "Kenya", image: "/residence_nairobi.jpg", nights: 5, credits: 5 },
    { city: "Washington, DC", country: "United States", image: "/residence_washington.jpg", nights: 10, credits: 10 }
  ];

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[var(--parchment)]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 pb-20">
        
        {/* 1. Welcome Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl md:text-[48px] font-bold text-navy tracking-tight leading-none mb-3">
            Good morning, {user.firstName || "Member"}.
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
              <span className="font-sans text-[13px] text-navy/60">available</span>
            </div>
          </Link>
          
          {/* Homes */}
          <Link href="/dashboard/listings" className="w-1/2 lg:w-1/4 group lg:px-8 lg:border-l border-[var(--hair)]">
            <div className="font-display text-[32px] md:text-[40px] font-bold text-navy leading-none mb-1 group-hover:text-[var(--gold-dark)] transition-colors">
              {activeListings}
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.12em]">My Homes</span>
              <span className="font-sans text-[13px] text-navy/60">listed</span>
            </div>
          </Link>
          
          {/* Swaps */}
          <Link href="/dashboard/swaps" className="w-1/2 lg:w-1/4 group lg:px-8 lg:border-l border-[var(--hair)]">
            <div className="font-display text-[32px] md:text-[40px] font-bold text-navy leading-none mb-1 group-hover:text-[var(--gold-dark)] transition-colors">
              {upcoming.length}
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.12em]">Active Swaps</span>
              <span className="font-sans text-[13px] text-navy/60">active</span>
            </div>
          </Link>
          
          {/* Messages */}
          <Link href="/dashboard/messages" className="w-1/2 lg:w-1/4 group lg:pl-8 lg:border-l border-[var(--hair)]">
            <div className="font-display text-[32px] md:text-[40px] font-bold text-navy leading-none mb-1 group-hover:text-[var(--gold-dark)] transition-colors">
              0 {/* Note: Client-side unread count lives in navbar, server-side count requires query */}
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.12em]">Messages</span>
              <span className="font-sans text-[13px] text-navy/60">unread</span>
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

        {/* Layout Grid for Next Steps & Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          {/* 4. Next Steps */}
          {showChecklist && (
            <div className="lg:col-span-5">
              <h3 className="font-sans text-xs font-bold text-navy uppercase tracking-[0.14em] mb-4">
                Your Next Steps
              </h3>
              <div className="border-t border-[var(--hair)]">
                {checklist.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-[var(--hair)] group">
                    <div className="flex items-center gap-4">
                      <span className={`flex-shrink-0 ${s.done ? "text-[var(--gold)]" : "text-navy/30"}`}>
                        {s.done ? <Check size={18} strokeWidth={2.5} /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-current" />}
                      </span>
                      <span className={`font-sans text-[15px] ${s.done ? "text-navy/60" : "text-navy font-medium"}`}>
                        {s.title}
                      </span>
                    </div>
                    {!s.done && s.href && (
                      <Link href={s.href} className="text-[13px] font-medium text-[var(--gold-dark)] hover:text-navy transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100">
                        {s.action} <ChevronRight size={14} />
                      </Link>
                    )}
                    {s.done && (
                      <span className="text-[13px] text-navy/40">Complete</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Upcoming Swap */}
          {upcoming.length > 0 && (
            <div className={showChecklist ? "lg:col-span-7" : "lg:col-span-12"}>
              <h3 className="font-sans text-xs font-bold text-navy uppercase tracking-[0.14em] mb-4">
                Your Upcoming Stay
              </h3>
              {upcoming.slice(0, 1).map((r) => (
                <div key={r.id} className="bg-[var(--navy)] rounded-lg p-8 relative overflow-hidden flex flex-col justify-between h-[220px]">
                  <div>
                    <h4 className="font-display text-[32px] text-[var(--gold)] font-bold leading-none mb-2">{r.listing.title}</h4>
                    <div className="font-sans text-white/80 text-[14px]">
                      {fmtDate(r.startDate)} — {fmtDate(r.endDate)}
                    </div>
                    <div className="font-sans text-white/60 text-[13px] mt-1">
                      {nights(r.startDate, r.endDate)} nights · {r.mode === "credits" ? `${nights(r.startDate, r.endDate)} credits` : "Direct Swap"}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <Link
                      href={`/dashboard/swaps`}
                      className="inline-flex items-center px-4 py-2 rounded border border-white/20 text-white font-sans text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-white hover:text-navy transition-colors"
                    >
                      View Swap
                    </Link>
                    <span className="font-sans text-[11px] font-bold text-[var(--gold)] uppercase tracking-[0.1em]">
                      {Math.max(0, Math.ceil((r.startDate.getTime() - Date.now()) / 86400000))} Days to go
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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

        {/* 7. Recent Activity */}
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
              <div key={r.id} className="flex items-center justify-between py-4 border-b border-[var(--hair)]">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--gold)]"><Check size={18} /></span>
                  <span className="font-sans text-[15px] text-navy">
                    Swap request {r.status === "COUNTER_OFFERED" ? "countered" : "received"} from {r.requester.fullName}
                  </span>
                </div>
                <span className="font-sans text-[13px] text-navy/50">{fmtDate(r.createdAt)}</span>
              </div>
            ))}
            {incoming.length === 0 && (
              <div className="py-8 text-[14px] text-navy/60 font-sans italic">
                No recent activity.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
