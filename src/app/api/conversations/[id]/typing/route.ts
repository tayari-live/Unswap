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

// GET /api/conversations/:id/typing[?after=<ISO>] → read/typing/presence status,
// plus only the messages newer than `after` (the hot, cheap incremental poll).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    const after = req.nextUrl.searchParams.get("after") ?? undefined
    return NextResponse.json(await getConversationStatus(session.user!.id as string, id, after))
  } catch (err) {
    return toErrorResponse(err)
  }
}
