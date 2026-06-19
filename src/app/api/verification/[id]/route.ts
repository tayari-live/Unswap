import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, toErrorResponse, ApiError } from "@/server/http"
import { approveSubmission, rejectSubmission } from "@/server/services/verification"

// PATCH /api/verification/:id — approve or reject a verification submission.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const { action, note } = await req.json()
    const actorId = session.user!.id as string

    if (action === "approve") {
      return NextResponse.json({ ok: true, ...(await approveSubmission({ actorId, id, note })) })
    }
    if (action === "reject") {
      return NextResponse.json(await rejectSubmission({ actorId, id, note }))
    }
    throw new ApiError(400, "Unknown action. Expected 'approve' or 'reject'.")
  } catch (err) {
    return toErrorResponse(err)
  }
}
