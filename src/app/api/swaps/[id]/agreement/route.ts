import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { buildAgreementPdf } from "@/server/services/agreement"

// GET /api/swaps/:id/agreement → download the Swap Agreement PDF (participants only).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    const pdf = await buildAgreementPdf(session.user!.id as string, id)
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="unswap-agreement-${id.slice(0, 8)}.pdf"`,
      },
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}
