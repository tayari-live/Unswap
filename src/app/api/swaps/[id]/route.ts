import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { updateSwap, respondToSwap } from "@/server/services/swaps"

// PATCH /api/swaps/:id
// Admins mediate (status/disputed); members act on their own swaps via `action`.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    const body = await req.json()
    const userId = session.user!.id as string

    if ((session.user as any).role === "admin") {
      return NextResponse.json(await updateSwap({ actorId: userId, id, status: body.status, disputed: body.disputed }))
    }
    return NextResponse.json(
      await respondToSwap({ userId, id, action: body.action, startDate: body.startDate, endDate: body.endDate })
    )
  } catch (err) {
    return toErrorResponse(err)
  }
}
