import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { PageHeader } from "@/components/ui/page-header"
import { ListingForm } from "../listing-form"

export const dynamic = "force-dynamic"

export default async function NewListingPage() {
  const session = await auth()
  if (!(session?.user as any)?.id) redirect("/login")

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PageHeader title="Add a listing" subtitle="Describe the home you'd like to offer for exchange." />
      <ListingForm mode="create" />
    </div>
  )
}
