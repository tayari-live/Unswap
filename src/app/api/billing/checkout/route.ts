import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse, ApiError } from "@/server/http"
import { MEMBERSHIP_ENABLED } from "@/lib/features"
import { createCheckout, isTierKey } from "@/server/services/billing"

// POST /api/billing/checkout { tier } → { url }
export async function POST(req: NextRequest) {
  try {
    // Closed while payments are off. Without STRIPE_SECRET_KEY createCheckout
    // falls back to activating the tier outright, so leaving this open would
    // hand out memberships to anyone who found the endpoint.
    if (!MEMBERSHIP_ENABLED) throw new ApiError(404, "Memberships are not available yet.")
    const session = await requireSession()
    if ((session.user as any).role !== "member") throw new ApiError(403, "Only members can subscribe.")
    const { tier } = await req.json()
    if (!isTierKey(tier)) throw new ApiError(400, "Unknown membership tier.")
    const result = await createCheckout(session.user!.id as string, tier)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
