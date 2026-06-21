import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { updateNotificationPrefs } from "@/server/services/profile"

// PATCH /api/profile/notifications — update the member's email preferences.
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const result = await updateNotificationPrefs(session.user!.id as string, body)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
