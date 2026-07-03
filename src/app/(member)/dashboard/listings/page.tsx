import Link from "next/link"
import { redirect } from "next/navigation"
import { PlusCircle, Home, ShieldAlert } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { listMemberListings } from "@/server/services/listings"
import { PageHeader } from "@/components/ui/page-header"
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
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="My Listings" subtitle="Create and manage the homes you offer for exchange." />
        <Link
          href="/dashboard/listings/new"
          className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <PlusCircle size={17} /> Add listing
        </Link>
      </div>

      {!canPublish && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--gold)]/40 bg-[var(--parchment)] p-4 mb-6">
          <ShieldAlert size={20} className="text-[var(--gold-dark)] flex-shrink-0" />
          <p className="text-sm text-neutral-dark">
            Confirm your email address to publish your listings to the network. You can create and edit drafts in the meantime.
          </p>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center mb-4">
            <Home size={26} />
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">No listings yet</h2>
          <p className="mt-2 text-sm text-neutral">Add your first home to start exchanging with vetted peers.</p>
          <Link
            href="/dashboard/listings/new"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-5 py-3 rounded-xl transition-colors"
          >
            <PlusCircle size={17} /> Add listing
          </Link>
        </div>
      ) : (
        <ListingsClient listings={listings} canPublish={canPublish} />
      )}
    </div>
  )
}
