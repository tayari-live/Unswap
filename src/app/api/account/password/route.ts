import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { changePassword } from "@/server/services/password-reset"

// POST /api/account/password — the signed-in user changes their own password.
// Available to any authenticated account (members and admins).
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { currentPassword, newPassword } = await req.json()
    const result = await changePassword(session.user!.id as string, currentPassword, newPassword)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
