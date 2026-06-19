import { NextRequest, NextResponse } from "next/server"
import { registerMember } from "@/server/services/registration"
import { toErrorResponse } from "@/server/http"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await registerMember({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
