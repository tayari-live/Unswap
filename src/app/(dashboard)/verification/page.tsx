import { listQueue } from "@/server/services/verification"
import VerificationClient from "./verification-client"

export const dynamic = "force-dynamic"

export default async function VerificationPage() {
  const submissions = await listQueue("PENDING")
  return <VerificationClient initialSubmissions={JSON.parse(JSON.stringify(submissions))} />
}
