import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, toErrorResponse, ApiError } from "@/server/http"
import { setMemberStatus, overrideTier } from "@/server/services/members"

// PATCH /api/members/:id — change status or override subscription tier.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const actorId = session.user!.id as string
    const body = await req.json()

    if (body.status) {
      return NextResponse.json(await setMemberStatus({ actorId, id, status: body.status }))
    }
    if (body.tier) {
      return NextResponse.json(await overrideTier({ actorId, id, tier: body.tier }))
    }
    throw new ApiError(400, "Provide a 'status' or 'tier' to update.")
  } catch (err) {
    return toErrorResponse(err)
  }
}
