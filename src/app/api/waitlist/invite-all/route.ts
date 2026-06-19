import { NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { inviteAllPending } from "@/server/services/waitlist"

// POST /api/waitlist/invite-all — admin bulk-invites all pending entries.
export async function POST() {
  try {
    const session = await requireAdmin()
    return NextResponse.json(await inviteAllPending(session.user!.id as string))
  } catch (err) {
    return toErrorResponse(err)
  }
}
