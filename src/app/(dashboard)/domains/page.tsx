import { listDomains } from "@/server/services/domains"
import DomainsClient from "./domains-client"

export const dynamic = "force-dynamic"

export default async function DomainsPage() {
  const domains = await listDomains()
  return <DomainsClient initialDomains={JSON.parse(JSON.stringify(domains))} />
}
