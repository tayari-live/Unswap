import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { importWaitlist, parseWaitlistCsv } from "@/server/services/waitlist"

// POST /api/waitlist/import — admin bulk-import of leads.
// Body: { csv?: string } (parsed server-side) or { rows?: [{email,name,organisation}] }.
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const rows = Array.isArray(body.rows) ? body.rows : typeof body.csv === "string" ? parseWaitlistCsv(body.csv) : []
    const result = await importWaitlist(session.user!.id as string, rows)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
