import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { updateProfile } from "@/server/services/profile"

// PATCH /api/profile — the signed-in member updates their own profile.
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const result = await updateProfile(session.user!.id as string, body)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
