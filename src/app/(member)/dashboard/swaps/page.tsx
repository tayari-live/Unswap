import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { listMemberSwaps } from "@/server/services/swaps"
import { PageHeader } from "@/components/ui/page-header"
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
    <div className="max-w-4xl mx-auto pb-12">
      <PageHeader title="Swap Requests" subtitle="Manage incoming and outgoing exchange requests." />
      <SwapsClient
        incoming={incoming.map(toRow)}
        outgoing={outgoing.map(toRow)}
        past={past.map(toRow)}
      />
    </div>
  )
}
