import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse, ApiError } from "@/server/http"
import { createCheckout, isTierKey } from "@/server/services/billing"

// POST /api/billing/checkout { tier } → { url }
export async function POST(req: NextRequest) {
  try {
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
