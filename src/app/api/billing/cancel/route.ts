import { NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { cancelSubscription } from "@/server/services/billing"

// POST /api/billing/cancel → cancel the member's subscription
export async function POST() {
  try {
    const session = await requireSession()
    return NextResponse.json(await cancelSubscription(session.user!.id as string))
  } catch (err) {
    return toErrorResponse(err)
  }
}
