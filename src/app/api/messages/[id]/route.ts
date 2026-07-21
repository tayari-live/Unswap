import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { deleteMessage } from "@/server/services/messaging"

// DELETE /api/messages/:id  { scope: "me" | "everyone" }
// "me" hides the message for the caller; "everyone" tombstones it (sender only).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    const { scope } = await req.json().catch(() => ({ scope: "me" }))
    return NextResponse.json(
      await deleteMessage({
        userId: session.user!.id as string,
        messageId: id,
        scope: scope === "everyone" ? "everyone" : "me",
      }),
    )
  } catch (err) {
    return toErrorResponse(err)
  }
}
