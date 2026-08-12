import Link from "next/link"
import { redirect } from "next/navigation"
import { Home, ShieldAlert } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { listMemberListings } from "@/server/services/listings"

import { ListingsClient } from "./listings-client"

export const dynamic = "force-dynamic"

export default async function MyListingsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const [user, listings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    listMemberListings(userId),
  ])
  // Publishing needs only a confirmed email — ID verification is required to
  // request/accept swaps, not to list.
  const canPublish = user?.verificationStatus !== "PENDING_EMAIL"

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display text-4xl md:text-[48px] font-bold text-[var(--fg)] tracking-tight leading-none mb-3">
            My Homes
          </h1>
          <p className="font-sans text-sm md:text-[15px] text-[var(--fg)]/65 max-w-xl">
            Manage the homes you've made available to the UnSwap network.
          </p>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="flex-shrink-0 inline-flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-navy bg-[var(--gold)] hover:bg-[var(--gold-dark)] px-6 py-3 rounded-md transition-colors shadow-sm"
        >
          + List a Home
        </Link>
      </div>

      {/* Stats Strip */}
      <div className="flex flex-wrap lg:flex-nowrap gap-y-8 mb-16">
        <div className="w-1/2 lg:w-1/4 group lg:pr-8">
          <div className="font-display text-[32px] md:text-[40px] font-bold text-[var(--fg)] leading-none mb-1">
            {listings.length}
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.12em]">Listed</span>
            <span className="font-sans text-[13px] text-[var(--fg)]/60 mt-1">homes</span>
          </div>
        </div>
        
        <div className="w-1/2 lg:w-1/4 group lg:px-8 lg:border-l border-[var(--hair)]">
          <div className="font-display text-[32px] md:text-[40px] font-bold text-[var(--fg)] leading-none mb-1">
            {listings.filter(l => l.status === "ACTIVE").length}
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.12em]">Active</span>
            <span className="font-sans text-[13px] text-[var(--fg)]/60 mt-1">listings</span>
          </div>
        </div>
        
        <div className="w-1/2 lg:w-1/4 group lg:px-8 lg:border-l border-[var(--hair)]">
          <div className="font-display text-[32px] md:text-[40px] font-bold text-[var(--fg)] leading-none mb-1">
            {listings.filter(l => l.status === "DRAFT" || l.status === "PAUSED").length}
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.12em]">Pending</span>
            <span className="font-sans text-[13px] text-[var(--fg)]/60 mt-1">review</span>
          </div>
        </div>
      </div>

      {!canPublish && (
        <div className="flex items-center gap-4 bg-[var(--gold)]/10 border border-transparent px-6 py-4 rounded-lg mb-12">
          <ShieldAlert size={20} className="text-[var(--gold-dark)] flex-shrink-0" />
          <p className="font-sans text-[14px] text-[var(--fg)]/80 leading-snug">
            Confirm your email address to publish your listings to the network. You can create and edit drafts in the meantime.
          </p>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--hair)] p-12 text-center max-w-2xl mx-auto mt-8 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--navy)]/5 text-[var(--gold-dark)] flex items-center justify-center mb-6">
            <Home size={28} strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-[32px] font-bold text-[var(--fg)] mb-3 leading-tight">Your home can open a door for someone else.</h2>
          <p className="font-sans text-[15px] text-[var(--fg)]/65 mb-8 max-w-md mx-auto">
            List a home and earn credits that you can use to stay in another member's home across the UnSwap network.
          </p>
          <Link
            href="/dashboard/listings/new"
            className="inline-flex items-center justify-center text-[13px] font-bold uppercase tracking-[0.08em] text-navy bg-[var(--gold)] hover:bg-navy hover:text-white px-8 py-3.5 rounded-md transition-colors shadow-sm"
          >
            List Your First Home
          </Link>
        </div>
      ) : (
        <ListingsClient listings={listings} canPublish={canPublish} />
      )}
    </div>
  )
}
