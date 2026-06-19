import { listWaitlist } from "@/server/services/waitlist"
import WaitlistClient from "./waitlist-client"

export const dynamic = "force-dynamic"

export default async function WaitlistPage() {
  const entries = await listWaitlist()
  return <WaitlistClient initialEntries={JSON.parse(JSON.stringify(entries))} />
}
