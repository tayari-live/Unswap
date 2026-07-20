import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { setTyping, getConversationStatus } from "@/server/services/messaging"

// POST /api/conversations/:id/typing → record that the viewer is typing
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    return NextResponse.json(await setTyping(session.user!.id as string, id))
  } catch (err) {
    return toErrorResponse(err)
  }
}

// GET /api/conversations/:id/typing → the other party's read + typing status
// (cheap: no message payload, does not mark the thread read)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    return NextResponse.json(await getConversationStatus(session.user!.id as string, id))
  } catch (err) {
    return toErrorResponse(err)
  }
}
