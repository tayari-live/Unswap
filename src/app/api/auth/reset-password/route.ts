import { NextRequest, NextResponse } from "next/server"
import { resetPassword } from "@/server/services/password-reset"
import { toErrorResponse } from "@/server/http"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await resetPassword(body.token, body.password)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
