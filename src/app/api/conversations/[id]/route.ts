import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { getConversationForUser, sendMessage } from "@/server/services/messaging"

// GET /api/conversations/:id → messages (marks the thread read for the viewer)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    return NextResponse.json(await getConversationForUser(session.user!.id as string, id))
  } catch (err) {
    return toErrorResponse(err)
  }
}

// POST /api/conversations/:id { body, attachmentUrl? } → send a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    const body = await req.json()
    const message = await sendMessage({
      userId: session.user!.id as string,
      conversationId: id,
      body: body.body,
      attachmentUrl: body.attachmentUrl,
    })
    return NextResponse.json(message, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
