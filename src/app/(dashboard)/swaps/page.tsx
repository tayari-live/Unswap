import { listSwaps } from "@/server/services/swaps"
import SwapsClient from "./swaps-client"

export const dynamic = "force-dynamic"

export default async function SwapsPage() {
  const swaps = await listSwaps()
  return <SwapsClient initialSwaps={JSON.parse(JSON.stringify(swaps))} />
}
