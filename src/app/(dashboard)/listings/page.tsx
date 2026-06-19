import { listListings } from "@/server/services/listings"
import ListingsClient from "./listings-client"

export const dynamic = "force-dynamic"

export default async function ListingsPage() {
  const listings = await listListings()
  return <ListingsClient initialListings={JSON.parse(JSON.stringify(listings))} />
}
