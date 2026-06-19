import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { getMemberListing } from "@/server/services/listings"
import { PageHeader } from "@/components/ui/page-header"
import { ListingForm, type ListingValues } from "../../listing-form"

export const dynamic = "force-dynamic"

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  const initial: ListingValues = {
    id: listing.id,
    title: listing.title,
    propertyType: listing.propertyType,
    city: listing.city,
    country: listing.country,
    neighbourhood: listing.neighbourhood ?? "",
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    maxGuests: listing.maxGuests,
    description: listing.description ?? "",
    exchangeType: listing.exchangeType,
    primaryPhotoUrl: listing.primaryPhotoUrl,
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PageHeader title="Edit listing" subtitle="Update the details of your home." />
      <ListingForm mode="edit" initial={initial} />
    </div>
  )
}
