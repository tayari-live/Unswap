import { NextResponse } from "next/server"
import { requireSession, toErrorResponse, ApiError } from "@/server/http"
import { MEMBERSHIP_ENABLED } from "@/lib/features"
import { cancelSubscription } from "@/server/services/billing"

// POST /api/billing/cancel → cancel the member's subscription
export async function POST() {
  try {
    // Closed while payments are off: there is no subscription to cancel, and
    // the call would still pause the member's listings on the way through.
    if (!MEMBERSHIP_ENABLED) throw new ApiError(404, "Memberships are not available yet.")
    const session = await requireSession()
    return NextResponse.json(await cancelSubscription(session.user!.id as string))
  } catch (err) {
    return toErrorResponse(err)
  }
}
