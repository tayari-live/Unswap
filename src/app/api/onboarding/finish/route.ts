import { NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { finishOnboarding } from "@/server/services/profile"

// POST /api/onboarding/finish — mark the member's onboarding complete.
export async function POST() {
  try {
    const session = await requireSession()
    return NextResponse.json(await finishOnboarding(session.user!.id as string))
  } catch (err) {
    return toErrorResponse(err)
  }
}
