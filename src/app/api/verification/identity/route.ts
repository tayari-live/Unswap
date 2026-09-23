import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse } from "@/server/http"
import { createIdentitySession } from "@/server/services/identity"

// POST /api/verification/identity — start an automated ID check (Stripe
// Identity) for the signed-in member. Returns a hosted URL to redirect to.
export async function POST(_req: NextRequest) {
  try {
    const session = await requireSession()
    const result = await createIdentitySession(session.user!.id as string)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
