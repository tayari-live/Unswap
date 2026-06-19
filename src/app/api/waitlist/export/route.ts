import { NextResponse } from "next/server"
import { requireAdmin, toErrorResponse } from "@/server/http"
import { waitlistCsv } from "@/server/services/waitlist"

// GET /api/waitlist/export — admin CSV download of the waitlist.
export async function GET() {
  try {
    await requireAdmin()
    const csv = await waitlistCsv()
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="unswap-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}
