import { listMembers } from "@/server/services/members"
import MembersClient from "./members-client"

export const dynamic = "force-dynamic"

export default async function MembersPage() {
  const members = await listMembers()
  return <MembersClient initialMembers={JSON.parse(JSON.stringify(members))} />
}
