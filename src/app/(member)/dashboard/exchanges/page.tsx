import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { listMemberExchanges } from "@/server/services/swaps"
import { ExchangesClient } from "./exchanges-client"

export const dynamic = "force-dynamic"

export default async function ExchangesPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const { upcoming, past } = await listMemberExchanges(userId)

  // Serialize dates for client
  const toRow = (s: any) => ({
    id: s.id,
    status: s.status,
    role: s.role,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    guests: s.guests,
    listing: { title: s.listing.title, city: s.listing.city, country: s.listing.country, photos: s.listing.photos },
    other: { id: s.other.id, fullName: s.other.fullName, avatarInitials: s.other.avatarInitials, organisation: s.other.organisation },
  })

  return (
    <div className="max-w-[1000px] mx-auto px-6 lg:px-10 pt-12 pb-20">
      <div className="mb-12">
        <h1 className="font-display text-4xl md:text-[48px] font-bold text-[var(--fg)] tracking-tight leading-none mb-3">
          My Exchanges
        </h1>
        <p className="font-sans text-sm md:text-[15px] text-[var(--fg)]/65 max-w-xl">
          Your confirmed and completed home exchanges.
        </p>
      </div>

      <ExchangesClient
        upcoming={upcoming.map(toRow)}
        past={past.map(toRow)}
      />
    </div>
  )
}
