import { NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { countNewMemberNotifications } from "@/server/services/member-notifications"
import { touchLastSeen } from "@/server/services/messaging"

// GET /api/member-notifications — unread activity count for the sidebar bell.
// The sidebar polls this on every member page, so it doubles as a presence
// heartbeat: bump lastSeenAt so chat partners see the member as online.
export async function GET() {
  try {
    const session = await requireSession()
    const userId = session.user!.id as string
    const [unread] = await Promise.all([
      countNewMemberNotifications(userId),
      touchLastSeen(userId),
    ])
    return NextResponse.json({ unread })
  } catch (err) {
    return toErrorResponse(err)
  }
}
