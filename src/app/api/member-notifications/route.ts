import { NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { countNewMemberNotifications } from "@/server/services/member-notifications"

// GET /api/member-notifications — unread activity count for the topbar bell.
export async function GET() {
  try {
    const session = await requireSession()
    const unread = await countNewMemberNotifications(session.user!.id as string)
    return NextResponse.json({ unread })
  } catch (err) {
    return toErrorResponse(err)
  }
}
