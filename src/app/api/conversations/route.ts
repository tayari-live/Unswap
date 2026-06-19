import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { listConversations, startConversation, getUnreadTotal } from "@/server/services/messaging"

// GET /api/conversations        → inbox list + unread total
// GET /api/conversations?count=1 → unread total only (for the nav badge poll)
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession()
    const userId = session.user!.id as string
    if (req.nextUrl.searchParams.get("count") === "1") {
      return NextResponse.json({ unread: await getUnreadTotal(userId) })
    }
    const conversations = await listConversations(userId)
    const unread = conversations.reduce((s, c) => s + c.unread, 0)
    return NextResponse.json({ conversations, unread })
  } catch (err) {
    return toErrorResponse(err)
  }
}

// POST /api/conversations { otherUserId, swapRequestId? } → conversation id
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { otherUserId, swapRequestId } = await req.json()
    const id = await startConversation(session.user!.id as string, otherUserId, swapRequestId)
    return NextResponse.json({ id })
  } catch (err) {
    return toErrorResponse(err)
  }
}
