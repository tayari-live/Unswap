import { NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { resendAllUnconfirmed } from "@/server/services/waitlist"

// POST /api/waitlist/resend-all — admin re-sends confirmation to all unconfirmed.
export async function POST() {
  try {
    const session = await requireAdmin()
    return NextResponse.json(await resendAllUnconfirmed(session.user!.id as string))
  } catch (err) {
    return toErrorResponse(err)
  }
}
