import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { getMemberListing } from "@/server/services/listings"
import { PageHeader } from "@/components/ui/page-header"
import { ListingWizard, type WizardValues } from "../../listing-wizard"

export const dynamic = "force-dynamic"

const day = (d: Date) => d.toISOString().slice(0, 10)

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const { id } = await params
  let listing
  try {
    listing = await getMemberListing(userId, id)
  } catch {
    redirect("/dashboard/listings")
  }

  const initial: WizardValues = {
    id: listing.id,
    title: listing.title,
    propertyType: listing.propertyType,
    fullAddress: listing.fullAddress ?? "",
    city: listing.city,
    neighbourhood: listing.neighbourhood ?? "",
    country: listing.country,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    maxGuests: listing.maxGuests,
    description: listing.description ?? "",
    amenities: listing.amenities,
    photos: listing.photos.map((p) => ({ url: p.url, caption: p.caption ?? "" })),
    swapDurations: listing.swapDurations,
    exchangeType: listing.exchangeType,
    blackouts: listing.blackouts.map((b) => ({ startDate: day(b.startDate), endDate: day(b.endDate) })),
    houseRules: listing.houseRules ?? "",
    emergencyName: listing.emergencyName ?? "",
    emergencyPhone: listing.emergencyPhone ?? "",
    emergencyRelationship: listing.emergencyRelationship ?? "",
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PageHeader title="Edit listing" subtitle="Update the details of your home." />
      <ListingWizard mode="edit" initial={initial} />
    </div>
  )
}
