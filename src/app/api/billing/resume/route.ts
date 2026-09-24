import { NextResponse } from "next/server"
import { requireSession, toErrorResponse, ApiError } from "@/server/http"
import { MEMBERSHIP_ENABLED } from "@/lib/features"
import { resumeSubscription } from "@/server/services/billing"

// POST /api/billing/resume → undo a scheduled cancellation (before period end)
export async function POST() {
  try {
    if (!MEMBERSHIP_ENABLED) throw new ApiError(404, "Memberships are not available yet.")
    const session = await requireSession()
    return NextResponse.json(await resumeSubscription(session.user!.id as string))
  } catch (err) {
    return toErrorResponse(err)
  }
}
