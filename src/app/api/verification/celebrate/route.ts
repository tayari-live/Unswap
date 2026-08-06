import { NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { getPendingVerification, markVerificationCelebrated } from "@/server/services/verification-celebration"

// GET /api/verification/celebrate — is there a "you are verified" moment owed?
// POST — mark it shown, so it happens exactly once.
export async function GET() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ pending: null })
  try {
    return NextResponse.json({ pending: await getPendingVerification(userId) })
  } catch {
    // A celebration is never worth surfacing an error on every page.
    return NextResponse.json({ pending: null })
  }
}

export async function POST() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 })
  await markVerificationCelebrated(userId)
  return NextResponse.json({ ok: true })
}
