import { listMembers } from "@/server/services/members"
import MembersClient from "./members-client"

export const dynamic = "force-dynamic"

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const members = await listMembers()
  return <MembersClient initialMembers={JSON.parse(JSON.stringify(members))} initialQuery={q ?? ""} />
}
