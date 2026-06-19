import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { addDomain, listDomains } from "@/server/services/domains"

export async function GET() {
  try {
    await requireAdmin()
    return NextResponse.json(await listDomains())
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const created = await addDomain({
      actorId: session.user!.id as string,
      domain: body.domain,
      label: body.label,
      fastTrack: body.fastTrack !== false,
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
