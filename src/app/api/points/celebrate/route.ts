import { NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { getUncelebratedGrants, markPointsCelebrated } from "@/server/services/points"
import { getPendingVerification } from "@/server/services/verification-celebration"

// GET /api/points/celebrate — grants the member has earned but not yet been
// congratulated for. POST — mark them celebrated so the moment fires only once.
export async function GET() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ grants: [] })
  try {
    // Verification grants points too. If that moment is still owed it will
    // present the point itself, so stand down rather than stacking a second
    // modal behind it.
    if (await getPendingVerification(userId)) return NextResponse.json({ grants: [] })
    return NextResponse.json({ grants: await getUncelebratedGrants(userId) })
  } catch {
    // Never let a transient DB blip surface as an error on every page.
    return NextResponse.json({ grants: [] })
  }
}

export async function POST() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 })
  await markPointsCelebrated(userId)
  return NextResponse.json({ ok: true })
}
