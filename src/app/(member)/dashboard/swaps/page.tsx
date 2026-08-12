import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { listMemberSwaps } from "@/server/services/swaps"
import { SwapsClient, type SwapRow } from "./swaps-client"

export const dynamic = "force-dynamic"

export default async function SwapRequestsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const { incoming, outgoing, past } = await listMemberSwaps(userId)

  // Serialize dates for the client component.
  const toRow = (s: any): SwapRow => ({
    id: s.id,
    status: s.status,
    mode: s.mode,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    guests: s.guests,
    message: s.message,
    listing: { title: s.listing.title, city: s.listing.city, country: s.listing.country },
    requester: { id: s.requester.id, fullName: s.requester.fullName, avatarInitials: s.requester.avatarInitials, organisation: s.requester.organisation },
    host: { id: s.host.id, fullName: s.host.fullName, avatarInitials: s.host.avatarInitials, organisation: s.host.organisation },
  })

  return (
    <div className="max-w-[1000px] mx-auto px-6 lg:px-10 pt-12 pb-20">
      <div className="mb-12">
        <h1 className="font-display text-4xl md:text-[48px] font-bold text-[var(--fg)] tracking-tight leading-none mb-3">
          Swap Requests
        </h1>
        <p className="font-sans text-sm md:text-[15px] text-[var(--fg)]/65 max-w-xl">
          Review requests to stay in your home or track the requests you've sent.
        </p>
      </div>

      <SwapsClient
        incoming={incoming.map(toRow)}
        outgoing={outgoing.map(toRow)}
        past={past.map(toRow)}
      />
    </div>
  )
}
