import { NextResponse } from "next/server"
import { toErrorResponse } from "@/server/http"
import { getWaitlistCountData } from "@/server/services/waitlist"

// GET /api/waitlist/count — public social proof (total confirmed + recent joiners).
export async function GET() {
  try {
    return NextResponse.json(await getWaitlistCountData())
  } catch (err) {
    return toErrorResponse(err)
  }
}
